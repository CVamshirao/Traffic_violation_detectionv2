package com.tvds.service;

import com.tvds.dto.DashboardStats;
import com.tvds.model.PaymentStatus;
import com.tvds.model.ViolationStatus;
import com.tvds.repository.FineRepository;
import com.tvds.repository.ViolationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ViolationRepository violationRepository;
    private final FineRepository fineRepository;

    public DashboardStats getStats() {
        long total = violationRepository.count();
        long pending = violationRepository.countByStatus(ViolationStatus.PENDING);
        long paid = fineRepository.countByPaymentStatus(PaymentStatus.PAID);
        long unpaid = fineRepository.countByPaymentStatus(PaymentStatus.UNPAID);
        return new DashboardStats(total, pending, paid, unpaid);
    }
}
