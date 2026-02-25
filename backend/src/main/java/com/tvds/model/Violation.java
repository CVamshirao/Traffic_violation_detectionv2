package com.tvds.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "violations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Violation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @Column(name = "vehicle_category")
    private String vehicleCategory;

    @Enumerated(EnumType.STRING)
    @Column(name = "violation_type", nullable = false)
    private ViolationType violationType;

    @Column(name = "violation_date", nullable = false)
    private LocalDateTime violationDate;

    @Column(nullable = false)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ViolationStatus status;

    @Column(name = "evidence_image")
    private String evidenceImage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_by")
    private User reportedBy;

    // AI Verification fields
    @Column(name = "ai_verified")
    private Boolean aiVerified;

    @Column(name = "ai_confidence")
    private Double aiConfidence;

    @Column(name = "ai_remarks", columnDefinition = "TEXT")
    private String aiRemarks;
}
