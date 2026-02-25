# YOLO Traffic Detection Service

FastAPI microservice that runs **YOLOv8n** to pre-filter violation images before they reach Gemini AI.

## Quick Start

```bash
# From the yolo_service/ directory:
start.bat          # Windows one-click launcher
```

Or manually:
```bash
pip install -r requirements.txt
uvicorn main:app --port 8081
```

The service starts at **http://localhost:8081**

## How it Works

| Step | What happens |
|------|-------------|
| 1 | Image uploaded → sent to `POST /detect` |
| 2 | YOLOv8n detects objects (cars, motorcycles, buses, persons, traffic lights…) |
| 3 | Compute `traffic_score` = weighted average of relevant detections |
| 4 | `score >= 0.40` → **PASSED** → image forwarded to Gemini AI |
| 5 | `score < 0.40` → **REJECTED** immediately with reason |

## Requirements

- Python 3.9+
- Internet access on first run (downloads `yolov8n.pt` ~6 MB automatically)

## API

### `GET /health`
```json
{ "status": "ok", "model": "yolov8n" }
```

### `POST /detect`
- Body: `multipart/form-data` — field `file` (image)
- Response:
```json
{
  "passed": true,
  "traffic_score": 0.87,
  "vehicle_detected": true,
  "detected_objects": [
    { "class": "car",        "confidence": 0.94, "weight": 1.0 },
    { "class": "motorcycle", "confidence": 0.87, "weight": 1.0 }
  ],
  "rejection_reason": null,
  "message": "YOLO Stage 1 PASSED — score 87%. Detected: car (94%), motorcycle (87%)"
}
```
