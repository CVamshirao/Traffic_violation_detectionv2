package com.tvds.service;

import com.tvds.model.*;
import com.tvds.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ViolationService {

    private final ViolationRepository violationRepository;
    private final VehicleRepository vehicleRepository;
    private final FineRepository fineRepository;
    private final AIVerificationService aiVerificationService;

    @Value("${app.upload.dir}")
    private String uploadDir;

    /**
     * AI-enhanced rule-based logic for determining fine amounts.
     * Fine increases for heavy vehicles and repeat offenders.
     */
    public double calculateFine(ViolationType type, String vehicleCategory) {
        double baseFine = switch (type) {
            case OVER_SPEED -> 1000.0;
            case NO_HELMET -> 500.0;
            case SIGNAL_JUMP -> 1500.0;
            case ILLEGAL_PARKING -> 500.0;
            case WRONG_WAY -> 2000.0;
            case NO_SEATBELT -> 1000.0;
            case TRIPLE_RIDING -> 1000.0;
            case USING_MOBILE -> 1500.0;
            case DRUNK_DRIVING -> 5000.0;
            case NO_LICENSE_PLATE -> 2000.0;
            case OVERLOADING -> 2500.0;
            case LANE_VIOLATION -> 1000.0;
        };

        // Vehicle category multiplier
        double multiplier = switch (vehicleCategory != null ? vehicleCategory : "Four Wheeler") {
            case "Two Wheeler" -> 0.8;
            case "Three Wheeler" -> 1.0;
            case "Four Wheeler" -> 1.2;
            case "Heavy Vehicle" -> 1.5;
            default -> 1.0;
        };

        return baseFine * multiplier;
    }

    @Transactional
    public Violation createViolation(String plateNumber, String violationTypeStr,
            String location, String vehicleCategory, MultipartFile image, User reporter) {
        String normalizedPlate = plateNumber.trim().toUpperCase();
        Vehicle vehicle = vehicleRepository.findByPlateNumber(normalizedPlate)
                .orElseGet(() -> {
                    // Auto-create vehicle when plate number is new
                    Vehicle newVehicle = Vehicle.builder()
                            .plateNumber(normalizedPlate)
                            .ownerName("Unknown — " + normalizedPlate)
                            .vehicleType(vehicleCategory != null ? vehicleCategory : "Four Wheeler")
                            .user(reporter)
                            .build();
                    return vehicleRepository.save(newVehicle);
                });

        // Use the flexible fromString lookup to fix DB truncation
        ViolationType violationType = ViolationType.fromString(violationTypeStr);

        // Save image
        String imagePath = null;
        if (image != null && !image.isEmpty()) {
            try {
                Path uploadPath = Paths.get(uploadDir);
                if (!Files.exists(uploadPath)) {
                    Files.createDirectories(uploadPath);
                }
                String filename = UUID.randomUUID() + "_" + image.getOriginalFilename();
                Path filePath = uploadPath.resolve(filename);
                Files.copy(image.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
                imagePath = filename;
            } catch (IOException e) {
                throw new RuntimeException("Failed to store image: " + e.getMessage());
            }
        }

        // === Gemini AI Image Verification ===
        AIVerificationService.VerificationResult aiResult = aiVerificationService.verifyImage(image, violationType,
                vehicleCategory);

        if (!aiResult.verified()) {
            // AI rejected — create violation with REJECTED status, no fine generated
            Violation violation = Violation.builder()
                    .vehicle(vehicle)
                    .vehicleCategory(vehicleCategory)
                    .violationType(violationType)
                    .violationDate(LocalDateTime.now())
                    .location(location)
                    .status(ViolationStatus.REJECTED)
                    .evidenceImage(imagePath)
                    .reportedBy(reporter)
                    .aiVerified(false)
                    .aiConfidence(aiResult.confidence())
                    .aiRemarks(aiResult.remarks())
                    .build();

            return violationRepository.save(violation);
        }

        // AI verified — create violation with PENDING status for admin review
        // Fine is NOT auto-generated — admin will set fine amount during approval
        Violation violation = Violation.builder()
                .vehicle(vehicle)
                .vehicleCategory(vehicleCategory)
                .violationType(violationType)
                .violationDate(LocalDateTime.now())
                .location(location)
                .status(ViolationStatus.PENDING)
                .evidenceImage(imagePath)
                .reportedBy(reporter)
                .aiVerified(true)
                .aiConfidence(aiResult.confidence())
                .aiRemarks(aiResult.remarks())
                .build();

        return violationRepository.save(violation);
    }

    @Transactional(readOnly = true)
    public List<Violation> getAllViolations() {
        return violationRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Violation> getUserViolations(Long userId) {
        return violationRepository.findByReportedById(userId);
    }

    @Transactional(readOnly = true)
    public List<Violation> getViolationsByStatus(ViolationStatus status) {
        return violationRepository.findByStatus(status);
    }

    /**
     * Admin approve with fine amount — creates the Fine record.
     */
    public Violation approveWithFine(Long id, double fineAmount) {
        Violation violation = violationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Violation not found"));

        if (violation.getStatus() != ViolationStatus.PENDING) {
            throw new RuntimeException(
                    "Only PENDING violations can be approved. Current status: " + violation.getStatus());
        }

        violation.setStatus(ViolationStatus.APPROVED);
        violation = violationRepository.save(violation);

        // Create fine with admin-specified amount
        Fine fine = Fine.builder()
                .violation(violation)
                .amount(fineAmount)
                .issuedDate(LocalDateTime.now())
                .paymentStatus(PaymentStatus.UNPAID)
                .build();
        fineRepository.save(fine);

        return violation;
    }

    public Violation updateStatus(Long id, String statusStr) {
        Violation violation = violationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Violation not found"));

        ViolationStatus status;
        try {
            status = ViolationStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid status: " + statusStr);
        }

        violation.setStatus(status);
        return violationRepository.save(violation);
    }

    @Transactional(readOnly = true)
    public Violation getViolationById(Long id) {
        return violationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Violation not found"));
    }
}
