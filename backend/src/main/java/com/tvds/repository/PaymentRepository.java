package com.tvds.repository;

import com.tvds.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByFineViolationReportedById(Long userId);

    boolean existsByFineId(Long fineId);
}
