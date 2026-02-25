package com.tvds.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

/**
 * YOLO Detection Service — Stage 1 pre-filter.
 *
 * Calls the Python FastAPI YOLO microservice to check whether the
 * uploaded image contains a recognisable vehicle or traffic scene.
 * Only images that pass (traffic_score >= threshold) are forwarded
 * to Gemini AI for contextual verification.
 */
@Service
@Slf4j
public class YoloDetectionService {

    @Value("${app.yolo.url:http://localhost:8081}")
    private String yoloUrl;

    @Value("${app.yolo.confidence-threshold:0.40}")
    private double threshold;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Result of YOLO Stage 1 detection.
     *
     * @param passed          true if traffic_score >= threshold
     * @param trafficScore    weighted detection score (0.0 – 1.0)
     * @param vehicleDetected at least one vehicle class found
     * @param detectedObjects human-readable summary: "car (94%), motorcycle (87%)"
     * @param rejectionReason null when passed; descriptive sentence when rejected
     */
    public record YoloResult(
            boolean passed,
            double trafficScore,
            boolean vehicleDetected,
            String detectedObjects,
            String rejectionReason) {
    }

    /**
     * Sends the image to the YOLO microservice and returns the detection result.
     * If the YOLO service is unavailable, falls back gracefully (passes the image
     * through).
     */
    public YoloResult detect(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            return new YoloResult(false, 0.0, false, "",
                    "No image provided for YOLO detection.");
        }

        try {
            // Build multipart request
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            byte[] bytes = image.getBytes();
            ByteArrayResource resource = new ByteArrayResource(bytes) {
                @Override
                public String getFilename() {
                    return image.getOriginalFilename() != null
                            ? image.getOriginalFilename()
                            : "image.jpg";
                }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", resource);

            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

            log.info("Calling YOLO service at {}/detect", yoloUrl);
            ResponseEntity<String> response = restTemplate.exchange(
                    yoloUrl + "/detect", HttpMethod.POST, request, String.class);

            return parseResponse(response.getBody());

        } catch (ResourceAccessException e) {
            // Python service not running — graceful fallback
            log.warn("YOLO service unavailable ({}). Falling back to Gemini-only path.", e.getMessage());
            return new YoloResult(true, 0.50, false,
                    "YOLO service offline — skipped",
                    null);

        } catch (Exception e) {
            log.error("Unexpected error calling YOLO service", e);
            return new YoloResult(true, 0.50, false,
                    "YOLO error — skipped",
                    null);
        }
    }

    private YoloResult parseResponse(String body) {
        try {
            JsonNode root = objectMapper.readTree(body);

            boolean passed = root.path("passed").asBoolean(false);
            double trafficScore = root.path("traffic_score").asDouble(0.0);
            boolean vehicleDetected = root.path("vehicle_detected").asBoolean(false);
            String rejectionReason = root.path("rejection_reason").isNull()
                    ? null
                    : root.path("rejection_reason").asText();

            // Build compact object summary
            List<String> parts = new ArrayList<>();
            JsonNode objects = root.path("detected_objects");
            if (objects.isArray()) {
                for (JsonNode obj : objects) {
                    String cls = obj.path("class").asText();
                    double conf = obj.path("confidence").asDouble();
                    if (conf >= 0.25) {
                        parts.add(String.format("%s (%.0f%%)", cls, conf * 100));
                    }
                }
            }
            String detectedObjects = parts.isEmpty() ? "none" : String.join(", ", parts);

            log.info("YOLO result — passed: {}, score: {}, objects: {}",
                    passed, String.format("%.2f", trafficScore), detectedObjects);

            return new YoloResult(passed, trafficScore, vehicleDetected, detectedObjects, rejectionReason);

        } catch (Exception e) {
            log.error("Failed to parse YOLO response", e);
            return new YoloResult(true, 0.50, false, "parse error", null);
        }
    }
}
