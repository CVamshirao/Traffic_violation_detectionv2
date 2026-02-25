package com.tvds.controller;

import com.tvds.dto.ApiResponse;
import com.tvds.model.*;
import com.tvds.service.ViolationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/violations")
@RequiredArgsConstructor
public class ViolationController {

    private final ViolationService violationService;

    @PostMapping
    public ResponseEntity<ApiResponse> createViolation(
            @RequestParam("plateNumber") String plateNumber,
            @RequestParam("violationType") String violationType,
            @RequestParam("location") String location,
            @RequestParam(value = "vehicleCategory", required = false, defaultValue = "Four Wheeler") String vehicleCategory,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @AuthenticationPrincipal User user) {
        try {
            Violation violation = violationService.createViolation(
                    plateNumber, violationType, location, vehicleCategory, image, user);

            Map<String, Object> result = toMap(violation);

            // Add suggested fine for reference
            double suggestedFine = violationService.calculateFine(violation.getViolationType(),
                    violation.getVehicleCategory());
            result.put("suggestedFine", suggestedFine);

            String msg;
            if (Boolean.TRUE.equals(violation.getAiVerified())) {
                msg = "✅ AI Verified — Violation reported and sent for admin review.";
            } else {
                msg = "❌ AI Rejected — The image does not appear to contain the claimed violation. " +
                        violation.getAiRemarks();
            }

            return ResponseEntity.ok(ApiResponse.success(msg, result));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse> getViolations(
            @RequestParam(value = "status", required = false) String status,
            @AuthenticationPrincipal User user) {

        List<Violation> violations;

        if (user.getRole() == Role.ADMIN || user.getRole() == Role.OFFICER) {
            if (status != null && !status.isEmpty()) {
                violations = violationService.getViolationsByStatus(ViolationStatus.valueOf(status.toUpperCase()));
            } else {
                violations = violationService.getAllViolations();
            }
        } else {
            violations = violationService.getUserViolations(user.getId());
        }

        List<Map<String, Object>> data = violations.stream().map(this::toMap).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Violations retrieved", data));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> getViolation(@PathVariable Long id) {
        try {
            Violation violation = violationService.getViolationById(id);
            return ResponseEntity.ok(ApiResponse.success("Violation retrieved", toMap(violation)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Admin approve with fine amount.
     */
    @PutMapping("/{id}/approve")
    public ResponseEntity<ApiResponse> approveViolation(@PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal User user) {
        if (user.getRole() != Role.ADMIN && user.getRole() != Role.OFFICER) {
            return ResponseEntity.status(403).body(ApiResponse.error("Unauthorized"));
        }
        try {
            double fineAmount = Double.parseDouble(body.get("fineAmount").toString());
            Violation violation = violationService.approveWithFine(id, fineAmount);
            return ResponseEntity.ok(ApiResponse.success("Violation approved and fine issued: ₹" + fineAmount,
                    toMap(violation)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse> updateStatus(@PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User user) {
        if (user.getRole() != Role.ADMIN && user.getRole() != Role.OFFICER) {
            return ResponseEntity.status(403).body(ApiResponse.error("Unauthorized"));
        }
        try {
            Violation violation = violationService.updateStatus(id, body.get("status"));
            return ResponseEntity.ok(ApiResponse.success("Status updated", toMap(violation)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    private Map<String, Object> toMap(Violation v) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", v.getId());
        map.put("vehicleId", v.getVehicle().getId());
        map.put("plateNumber", v.getVehicle().getPlateNumber());
        map.put("ownerName", v.getVehicle().getOwnerName());
        map.put("vehicleCategory", v.getVehicleCategory());
        map.put("violationType", v.getViolationType().getDisplayName());
        map.put("violationDate", v.getViolationDate().toString());
        map.put("location", v.getLocation());
        map.put("status", v.getStatus().name());
        map.put("evidenceImage", v.getEvidenceImage());
        map.put("aiVerified", v.getAiVerified());
        map.put("aiConfidence", v.getAiConfidence());
        map.put("aiRemarks", v.getAiRemarks());
        // Reporter info
        if (v.getReportedBy() != null) {
            map.put("reportedByName", v.getReportedBy().getName());
            map.put("reportedByEmail", v.getReportedBy().getEmail());
        }
        // Suggested fine for admin reference
        map.put("suggestedFine", violationService.calculateFine(v.getViolationType(), v.getVehicleCategory()));
        return map;
    }
}
