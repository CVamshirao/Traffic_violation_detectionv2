package com.tvds.repository;

import com.tvds.model.Fine;
import com.tvds.model.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FineRepository extends JpaRepository<Fine, Long> {
    Optional<Fine> findByViolationId(Long violationId);

    List<Fine> findByViolationReportedById(Long userId);

    long countByPaymentStatus(PaymentStatus status);
}
