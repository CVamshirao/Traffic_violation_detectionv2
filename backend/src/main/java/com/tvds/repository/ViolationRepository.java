package com.tvds.repository;

import com.tvds.model.Violation;
import com.tvds.model.ViolationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ViolationRepository extends JpaRepository<Violation, Long> {
    List<Violation> findByReportedById(Long userId);

    List<Violation> findByStatus(ViolationStatus status);

    List<Violation> findByVehicleId(Long vehicleId);

    long countByStatus(ViolationStatus status);
}
