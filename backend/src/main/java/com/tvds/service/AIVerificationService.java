package com.tvds.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tvds.model.ViolationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.Base64;
import java.util.List;
import java.util.Map;

/**
 * Two-Stage AI Verification Service.
 *
 * Stage 1 — YOLO (YoloDetectionService): object-detection pre-filter.
 * Detects vehicles and traffic elements. Rejects images that have no
 * recognisable traffic scene (score < 0.40) immediately, without calling
 * Gemini.
 *
 * Stage 2 — Gemini (Google Generative AI): contextual analysis.
 * Only reached when Stage 1 passes. Verifies the specific violation type.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AIVerificationService {

        private final YoloDetectionService yoloDetectionService;

        @Value("${app.gemini.api-key:}")
        private String geminiApiKey;

        @Value("${app.gemini.model:gemini-2.0-flash}")
        private String geminiModel;

        private final RestTemplate restTemplate = new RestTemplate();
        private final ObjectMapper objectMapper = new ObjectMapper();

        /** Gemini confidence threshold to accept a violation. */
        private static final double GEMINI_THRESHOLD = 0.55;

        /**
         * Represents the combined result of both verification stages.
         *
         * @param verified   true if image passed both YOLO and Gemini
         * @param confidence final confidence score (0.0 – 1.0)
         * @param remarks    detailed explanation shown to user and admin
         */
        public record VerificationResult(
                        boolean verified,
                        double confidence,
                        String remarks) {
        }

        /**
         * Entry point: runs YOLO Stage 1, then Gemini Stage 2 (if Stage 1 passes).
         */
        public VerificationResult verifyImage(MultipartFile image, ViolationType violationType,
                        String vehicleCategory) {

                // ── Basic file validation ─────────────────────────────────
                if (image == null || image.isEmpty()) {
                        return new VerificationResult(false, 0.0,
                                        "❌ No evidence image provided. An image is mandatory for verification.");
                }

                String contentType = image.getContentType();
                if (contentType == null || !contentType.startsWith("image/")) {
                        return new VerificationResult(false, 0.0,
                                        "❌ Invalid file format. Please upload a JPEG or PNG image.");
                }

                // ─────────────────────────────────────────────────────────
                // STAGE 1: YOLO Object Detection
                // ─────────────────────────────────────────────────────────
                log.info("=== Stage 1: YOLO Detection ===");
                YoloDetectionService.YoloResult yolo = yoloDetectionService.detect(image);
                log.info("YOLO result — passed: {}, score: {}, objects: {}",
                                yolo.passed(), yolo.trafficScore(), yolo.detectedObjects());

                if (!yolo.passed()) {
                        // Hard reject at Stage 1 — no Gemini call
                        String remarks = String.format(
                                        "🔍 YOLO Stage 1 REJECTED (score: %.0f%% < 40%% threshold)\n" +
                                                        "Detected: %s\n" +
                                                        "Reason: %s",
                                        yolo.trafficScore() * 100,
                                        yolo.detectedObjects().isBlank() ? "nothing" : yolo.detectedObjects(),
                                        yolo.rejectionReason());

                        return new VerificationResult(false, yolo.trafficScore(), remarks);
                }

                // ─────────────────────────────────────────────────────────
                // STAGE 2: Gemini Contextual Verification
                // ─────────────────────────────────────────────────────────
                log.info("=== Stage 2: Gemini Verification ===");

                // Build YOLO prefix for the combined remark
                String yoloSummary = String.format("🔍 YOLO Stage 1 PASSED (score: %.0f%%) — Detected: %s",
                                yolo.trafficScore() * 100, yolo.detectedObjects());

                if (geminiApiKey == null || geminiApiKey.isBlank()) {
                        log.warn("Gemini API key not configured — falling back to YOLO-only result");
                        return new VerificationResult(true, yolo.trafficScore(),
                                        yoloSummary
                                                        + "\n⚠️ Gemini Stage 2 skipped (no API key). Image accepted with YOLO validation only.");
                }

                try {
                        VerificationResult geminiResult = callGeminiApi(image, violationType, vehicleCategory);
                        // Combine both stage remarks
                        String combinedRemarks = yoloSummary + "\n" + geminiResult.remarks();
                        return new VerificationResult(geminiResult.verified(), geminiResult.confidence(),
                                        combinedRemarks);

                } catch (Exception e) {
                        log.warn("Gemini API call failed ({}). Trying heuristic fallback...", e.getMessage());

                        // ── FALLBACK: Heuristic analysis via YOLO /analyze endpoint ──
                        try {
                                VerificationResult heuristicResult = callHeuristicAnalysis(image, violationType,
                                                vehicleCategory);
                                String combinedRemarks = yoloSummary
                                                + "\n⚠️ Gemini unavailable — used heuristic AI (free).\n"
                                                + heuristicResult.remarks();
                                return new VerificationResult(heuristicResult.verified(),
                                                heuristicResult.confidence(), combinedRemarks);
                        } catch (Exception fallbackEx) {
                                log.error("Heuristic fallback also failed", fallbackEx);
                                return new VerificationResult(true, yolo.trafficScore(),
                                                yoloSummary
                                                                + "\n⚠️ Gemini Stage 2 unavailable. Heuristic fallback also failed. "
                                                                + "Image accepted (YOLO passed). Error: "
                                                                + e.getMessage());
                        }
                }
        }

        // ── Gemini API call ──────────────────────────────────────────

        private VerificationResult callGeminiApi(MultipartFile image, ViolationType violationType,
                        String vehicleCategory) throws Exception {

                String base64Image = Base64.getEncoder().encodeToString(image.getBytes());
                String mimeType = image.getContentType();
                String prompt = buildPrompt(violationType, vehicleCategory);

                Map<String, Object> requestBody = Map.of(
                                "contents", List.of(
                                                Map.of("parts", List.of(
                                                                Map.of("text", prompt),
                                                                Map.of("inlineData", Map.of(
                                                                                "mimeType", mimeType,
                                                                                "data", base64Image))))),
                                "generationConfig", Map.of(
                                                "temperature", 0.1,
                                                "maxOutputTokens", 1024));

                String url = String.format(
                                "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                                geminiModel, geminiApiKey);

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(requestBody), headers);

                log.info("Calling Gemini for: {} | {}", violationType.getDisplayName(), vehicleCategory);
                ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
                return parseGeminiResponse(response.getBody(), violationType);
        }

        private String buildPrompt(ViolationType violationType, String vehicleCategory) {
                return String.format(
                                """
                                                You are a traffic violation verification AI. The image has already been confirmed by a YOLO \
                                                object detector to contain a vehicle or traffic scene.

                                                Your task: determine if this image shows evidence of a "%s" traffic violation involving a "%s".

                                                RULES:
                                                1. A vehicle (%s) must be visible — YOLO confirmed this, so be lenient.
                                                2. The claimed violation "%s" should be plausibly evidenced.
                                                3. Reject clearly unrelated or staged images.
                                                4. Be reasonably lenient for genuine traffic scenarios.

                                                Respond in EXACTLY this JSON format — no other text:
                                                {
                                                  "is_violation": true or false,
                                                  "confidence": 0.0 to 1.0,
                                                  "vehicle_detected": true or false,
                                                  "is_traffic_scene": true or false,
                                                  "remarks": "Brief explanation of what you see and your verdict"
                                                }
                                                """,
                                violationType.getDisplayName(),
                                vehicleCategory != null ? vehicleCategory : "vehicle",
                                vehicleCategory != null ? vehicleCategory : "vehicle",
                                violationType.getDisplayName());
        }

        private VerificationResult parseGeminiResponse(String responseBody, ViolationType violationType) {
                try {
                        JsonNode root = objectMapper.readTree(responseBody);
                        JsonNode candidates = root.path("candidates");
                        if (!candidates.isArray() || candidates.isEmpty()) {
                                log.warn("Gemini returned no candidates");
                                return new VerificationResult(true, 0.60,
                                                "🤖 Gemini Stage 2: analysis inconclusive — accepted for manual review.");
                        }

                        String text = candidates.get(0).path("content").path("parts").get(0).path("text").asText();
                        log.debug("Gemini raw response: {}", text);

                        // Strip markdown code fences if present
                        String jsonStr = text;
                        if (text.contains("```json")) {
                                jsonStr = text.substring(text.indexOf("```json") + 7);
                                jsonStr = jsonStr.substring(0, jsonStr.indexOf("```")).trim();
                        } else if (text.contains("```")) {
                                jsonStr = text.substring(text.indexOf("```") + 3);
                                jsonStr = jsonStr.substring(0, jsonStr.indexOf("```")).trim();
                        }

                        JsonNode analysis = objectMapper.readTree(jsonStr);

                        boolean isViolation = analysis.path("is_violation").asBoolean(false);
                        double confidence = analysis.path("confidence").asDouble(0.5);
                        boolean vehicleDetected = analysis.path("vehicle_detected").asBoolean(true); // YOLO confirmed
                        boolean isTrafficScene = analysis.path("is_traffic_scene").asBoolean(true);
                        String remarks = analysis.path("remarks").asText("No detailed analysis available.");

                        double finalConfidence = confidence;
                        if (!vehicleDetected)
                                finalConfidence *= 0.5;
                        if (!isTrafficScene)
                                finalConfidence *= 0.6;
                        finalConfidence = Math.max(0.0, Math.min(1.0, finalConfidence));

                        boolean verified = isViolation && finalConfidence >= GEMINI_THRESHOLD;

                        String prefix = verified ? "✅ Gemini Stage 2 VERIFIED" : "❌ Gemini Stage 2 REJECTED";
                        String fullRemarks = String.format(
                                        "%s — %s | Vehicle: %s | Traffic scene: %s | Confidence: %.0f%%",
                                        prefix, remarks,
                                        vehicleDetected ? "Yes" : "No",
                                        isTrafficScene ? "Yes" : "No",
                                        finalConfidence * 100);

                        log.info("Gemini — verified: {}, confidence: {}, violation: {}",
                                        verified, String.format("%.2f", finalConfidence), violationType);

                        return new VerificationResult(verified, Math.round(finalConfidence * 100.0) / 100.0,
                                        fullRemarks);

                } catch (Exception e) {
                        log.error("Failed to parse Gemini response", e);
                        return new VerificationResult(true, 0.60,
                                        "🤖 Gemini Stage 2: response could not be parsed — accepted for manual review. Error: "
                                                        + e.getMessage());
                }
        }

        // ── Heuristic fallback via YOLO /analyze ────────────────────

        @Value("${app.yolo.url:http://localhost:8081}")
        private String yoloUrl;

        private VerificationResult callHeuristicAnalysis(MultipartFile image, ViolationType violationType,
                        String vehicleCategory) throws Exception {

                byte[] bytes = image.getBytes();
                org.springframework.core.io.ByteArrayResource resource = new org.springframework.core.io.ByteArrayResource(
                                bytes) {
                        @Override
                        public String getFilename() {
                                return image.getOriginalFilename() != null ? image.getOriginalFilename() : "image.jpg";
                        }
                };

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.MULTIPART_FORM_DATA);

                org.springframework.util.MultiValueMap<String, Object> body = new org.springframework.util.LinkedMultiValueMap<>();
                body.add("file", resource);
                body.add("violation_type", violationType.name());
                body.add("vehicle_category", vehicleCategory != null ? vehicleCategory : "Four Wheeler");

                HttpEntity<org.springframework.util.MultiValueMap<String, Object>> request = new HttpEntity<>(body,
                                headers);

                log.info("Calling heuristic /analyze for: {} | {}", violationType.name(), vehicleCategory);
                ResponseEntity<String> response = restTemplate.exchange(
                                yoloUrl + "/analyze", HttpMethod.POST, request, String.class);

                return parseHeuristicResponse(response.getBody());
        }

        private VerificationResult parseHeuristicResponse(String responseBody) throws Exception {
                JsonNode root = objectMapper.readTree(responseBody);

                boolean isViolation = root.path("is_violation").asBoolean(false);
                double confidence = root.path("confidence").asDouble(0.5);
                boolean vehicleDetected = root.path("vehicle_detected").asBoolean(false);
                boolean isTrafficScene = root.path("is_traffic_scene").asBoolean(false);
                String remarks = root.path("remarks").asText("No analysis available.");

                boolean verified = isViolation && confidence >= GEMINI_THRESHOLD;

                String prefix = verified ? "✅ Heuristic AI VERIFIED" : "❌ Heuristic AI REJECTED";
                String fullRemarks = String.format(
                                "%s — %s | Vehicle: %s | Traffic scene: %s | Confidence: %.0f%%",
                                prefix, remarks,
                                vehicleDetected ? "Yes" : "No",
                                isTrafficScene ? "Yes" : "No",
                                confidence * 100);

                log.info("Heuristic — verified: {}, confidence: {}", verified, String.format("%.2f", confidence));
                return new VerificationResult(verified, Math.round(confidence * 100.0) / 100.0, fullRemarks);
        }
}
