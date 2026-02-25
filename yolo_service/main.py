"""
YOLO Detection Microservice
===========================
FastAPI service that uses YOLOv8 to detect vehicles and traffic
elements in uploaded images. Acts as Stage 1 pre-filter before
Gemini AI analyzes the image contextually.

Endpoint: POST /detect
"""

import io
import logging
from typing import Optional
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
import uvicorn

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("yolo-service")

app = FastAPI(
    title="YOLO Traffic Detection Service",
    description="Detects vehicles and traffic scenes using YOLOv8",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Lazy-load YOLOv8 model to avoid slow startup ──────────────────
_model = None

def get_model():
    global _model
    if _model is None:
        logger.info("Loading YOLOv8n model (first-time download ~6 MB)...")
        from ultralytics import YOLO
        _model = YOLO("yolov8n.pt")   # nano — fastest, downloads automatically
        logger.info("YOLOv8n loaded successfully.")
    return _model


# ── COCO class IDs relevant to traffic violations ─────────────────
# Full COCO list: https://docs.ultralytics.com/datasets/detect/coco/
TRAFFIC_CLASSES = {
    0:  ("person",         0.5),   # base weight
    1:  ("bicycle",        0.8),
    2:  ("car",            1.0),   # highest weight — core violation evidence
    3:  ("motorcycle",     1.0),
    5:  ("bus",            1.0),
    7:  ("truck",          1.0),
    9:  ("traffic light",  0.7),
    11: ("stop sign",      0.7),
    # heavy/special
    4:  ("airplane",       0.0),   # irrelevant — zero weight
    6:  ("train",          0.0),
}

# Minimum confidence for an object to count
OBJECT_CONF_MIN = 0.25

# Traffic-scene score threshold to PASS Stage 1
PASS_THRESHOLD = 0.40


class DetectionResponse(BaseModel):
    passed: bool
    traffic_score: float
    vehicle_detected: bool
    detected_objects: list[dict]
    rejection_reason: Optional[str]
    message: str


@app.get("/health")
def health():
    return {"status": "ok", "model": "yolov8n"}


@app.post("/detect", response_model=DetectionResponse)
async def detect(file: UploadFile = File(...)):
    # ── Validate content type ──────────────────────────────────────
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, detail="Only image files are accepted.")

    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        raise HTTPException(400, detail=f"Cannot read image: {e}")

    # ── Run YOLOv8 detection ───────────────────────────────────────
    model = get_model()
    results = model(image, verbose=False, conf=OBJECT_CONF_MIN)[0]

    detected_objects = []
    vehicle_detected = False
    weighted_score = 0.0
    total_weight = 0.0

    for box in results.boxes:
        cls_id = int(box.cls[0])
        conf = float(box.conf[0])
        class_name, weight = TRAFFIC_CLASSES.get(cls_id, (f"class_{cls_id}", 0.2))

        detected_objects.append({
            "class": class_name,
            "confidence": round(conf, 3),
            "weight": weight,
        })

        if weight > 0:
            weighted_score += conf * weight
            total_weight += weight

        if cls_id in (2, 3, 5, 7, 1, 4) and conf >= OBJECT_CONF_MIN:  # vehicles
            vehicle_detected = True

    # Normalise score to 0–1 range
    traffic_score = (weighted_score / total_weight) if total_weight > 0 else 0.0
    traffic_score = round(min(traffic_score, 1.0), 3)

    logger.info(
        "YOLO result — objects: %s, vehicle: %s, score: %.3f",
        [d["class"] for d in detected_objects],
        vehicle_detected,
        traffic_score,
    )

    # ── Decision ──────────────────────────────────────────────────
    if traffic_score < PASS_THRESHOLD:
        if not detected_objects:
            reason = (
                "No recognizable objects detected in the image. "
                "Please upload a clear photo of the traffic violation."
            )
        elif not vehicle_detected:
            top = detected_objects[0]["class"] if detected_objects else "unknown"
            reason = (
                f"No vehicle detected in the image (top detection: '{top}', score: {traffic_score:.2f}). "
                "Evidence must clearly show the vehicle involved in the violation."
            )
        else:
            reason = (
                f"Low traffic-scene confidence ({traffic_score:.0%}). "
                "The image does not clearly depict a traffic violation scenario. "
                "Please upload a clearer, well-lit photo."
            )

        return DetectionResponse(
            passed=False,
            traffic_score=traffic_score,
            vehicle_detected=vehicle_detected,
            detected_objects=detected_objects,
            rejection_reason=reason,
            message=f"YOLO Stage 1 REJECTED — score {traffic_score:.0%} < threshold {PASS_THRESHOLD:.0%}",
        )

    # Passed
    obj_summary = ", ".join(
        f"{d['class']} ({d['confidence']:.0%})" for d in detected_objects[:5]
    )
    return DetectionResponse(
        passed=True,
        traffic_score=traffic_score,
        vehicle_detected=vehicle_detected,
        detected_objects=detected_objects,
        rejection_reason=None,
        message=f"YOLO Stage 1 PASSED — score {traffic_score:.0%}. Detected: {obj_summary}",
    )


# ══════════════════════════════════════════════════════════════════
# HEURISTIC VIOLATION ANALYSIS — Free Stage 2 (Gemini alternative)
# ══════════════════════════════════════════════════════════════════

# Maps violation types to expected YOLO detections
VIOLATION_RULES = {
    "NO_HELMET": {
        "required_any": ["motorcycle", "bicycle"],
        "boosts": ["person"],
        "description": "No helmet violation: expects a two-wheeler with a rider",
        "base_confidence": 0.70,
    },
    "SIGNAL_JUMP": {
        "required_any": ["car", "motorcycle", "bus", "truck", "bicycle"],
        "boosts": ["traffic light"],
        "description": "Signal jump: expects a vehicle near a traffic signal",
        "base_confidence": 0.65,
    },
    "ILLEGAL_PARKING": {
        "required_any": ["car", "motorcycle", "bus", "truck"],
        "boosts": [],
        "description": "Illegal parking: expects a stationary vehicle",
        "base_confidence": 0.70,
    },
    "OVER_SPEED": {
        "required_any": ["car", "motorcycle", "bus", "truck"],
        "boosts": [],
        "description": "Over-speed: vehicle detected (speed not verifiable from image)",
        "base_confidence": 0.60,
    },
    "WRONG_WAY": {
        "required_any": ["car", "motorcycle", "bus", "truck", "bicycle"],
        "boosts": [],
        "description": "Wrong-way driving: expects a vehicle on a road",
        "base_confidence": 0.65,
    },
    "NO_SEATBELT": {
        "required_any": ["car", "bus", "truck"],
        "boosts": ["person"],
        "description": "No seatbelt: expects a four-wheeler with visible occupant",
        "base_confidence": 0.65,
    },
    "TRIPLE_RIDING": {
        "required_any": ["motorcycle"],
        "boosts": ["person"],
        "description": "Triple riding: expects a motorcycle with multiple persons",
        "base_confidence": 0.70,
    },
    "USING_MOBILE": {
        "required_any": ["car", "motorcycle", "bus", "truck"],
        "boosts": ["person", "cell phone"],
        "description": "Using mobile while driving: expects a vehicle and driver",
        "base_confidence": 0.60,
    },
    "DRUNK_DRIVING": {
        "required_any": ["car", "motorcycle", "bus", "truck"],
        "boosts": ["person"],
        "description": "Drunk driving: expects a vehicle (cannot verify intoxication from image)",
        "base_confidence": 0.55,
    },
    "NO_LICENSE_PLATE": {
        "required_any": ["car", "motorcycle", "bus", "truck"],
        "boosts": [],
        "description": "No license plate: expects a vehicle",
        "base_confidence": 0.70,
    },
    "OVERLOADING": {
        "required_any": ["truck", "bus", "car"],
        "boosts": ["person"],
        "description": "Overloading: expects a vehicle with excessive load or passengers",
        "base_confidence": 0.65,
    },
    "LANE_VIOLATION": {
        "required_any": ["car", "motorcycle", "bus", "truck"],
        "boosts": [],
        "description": "Lane violation: expects a vehicle on a road",
        "base_confidence": 0.65,
    },
}


class AnalyzeRequest(BaseModel):
    violation_type: str
    vehicle_category: Optional[str] = None


class AnalyzeResponse(BaseModel):
    is_violation: bool
    confidence: float
    vehicle_detected: bool
    is_traffic_scene: bool
    remarks: str


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    file: UploadFile = File(...),
    violation_type: str = "ILLEGAL_PARKING",
    vehicle_category: str = "Four Wheeler",
):
    """
    Heuristic-based violation analysis (free Stage 2).
    Uses YOLO detections + violation-type rules to determine
    whether the image plausibly shows the claimed violation.
    """
    # ── Validate ──────────────────────────────────────────────────
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, detail="Only image files are accepted.")

    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        raise HTTPException(400, detail=f"Cannot read image: {e}")

    # ── Run YOLO detection ────────────────────────────────────────
    model = get_model()
    results = model(image, verbose=False, conf=OBJECT_CONF_MIN)[0]

    detected_classes = []
    max_vehicle_conf = 0.0
    vehicle_detected = False
    person_count = 0

    for box in results.boxes:
        cls_id = int(box.cls[0])
        conf = float(box.conf[0])
        class_name, weight = TRAFFIC_CLASSES.get(cls_id, (f"class_{cls_id}", 0.2))
        detected_classes.append((class_name, conf))

        if cls_id in (2, 3, 5, 7, 1) and conf >= OBJECT_CONF_MIN:
            vehicle_detected = True
            max_vehicle_conf = max(max_vehicle_conf, conf)
        if cls_id == 0:
            person_count += 1

    detected_names = [c[0] for c in detected_classes]
    is_traffic_scene = vehicle_detected or "traffic light" in detected_names or "stop sign" in detected_names

    # ── Apply violation-type rules ────────────────────────────────
    vtype = violation_type.upper().replace(" ", "_")
    rules = VIOLATION_RULES.get(vtype, VIOLATION_RULES.get("ILLEGAL_PARKING"))

    # Check if any required object is present
    required_found = any(r in detected_names for r in rules["required_any"])
    boost_found = sum(1 for b in rules["boosts"] if b in detected_names)

    if not detected_classes:
        # No objects at all
        return AnalyzeResponse(
            is_violation=False,
            confidence=0.15,
            vehicle_detected=False,
            is_traffic_scene=False,
            remarks="No objects detected in the image. Cannot verify violation.",
        )

    if not required_found:
        # Objects found but not the required ones
        top_objects = ", ".join(f"{c} ({int(conf*100)}%)" for c, conf in detected_classes[:5])
        return AnalyzeResponse(
            is_violation=False,
            confidence=0.30,
            vehicle_detected=vehicle_detected,
            is_traffic_scene=is_traffic_scene,
            remarks=f"Expected {' or '.join(rules['required_any'])} for {vtype} violation, "
                    f"but detected: {top_objects}. {rules['description']}.",
        )

    # Required object found — calculate confidence
    confidence = rules["base_confidence"]

    # Boost for high vehicle confidence
    if max_vehicle_conf > 0.7:
        confidence += 0.10
    elif max_vehicle_conf > 0.5:
        confidence += 0.05

    # Boost for matching context objects
    confidence += boost_found * 0.05

    # Special boost for TRIPLE_RIDING if multiple persons
    if vtype == "TRIPLE_RIDING" and person_count >= 3:
        confidence += 0.15
    elif vtype == "TRIPLE_RIDING" and person_count >= 2:
        confidence += 0.08

    # Special boost for NO_HELMET: motorcycle + person
    if vtype == "NO_HELMET" and "person" in detected_names and any(
        c in detected_names for c in ["motorcycle", "bicycle"]
    ):
        confidence += 0.10

    # Cap confidence
    confidence = round(min(confidence, 0.95), 2)

    top_objects = ", ".join(f"{c} ({int(conf*100)}%)" for c, conf in detected_classes[:5])
    remarks = (
        f"Heuristic analysis for '{vtype}': {rules['description']}. "
        f"Detected: {top_objects}. "
        f"Vehicle confidence: {max_vehicle_conf:.0%}. "
        f"Verdict: {'Plausible violation' if confidence >= 0.55 else 'Insufficient evidence'}."
    )

    logger.info("Heuristic analysis — type: %s, confidence: %.2f, vehicle: %s",
                vtype, confidence, vehicle_detected)

    return AnalyzeResponse(
        is_violation=confidence >= 0.55,
        confidence=confidence,
        vehicle_detected=vehicle_detected,
        is_traffic_scene=is_traffic_scene,
        remarks=remarks,
    )


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8081, reload=False)
