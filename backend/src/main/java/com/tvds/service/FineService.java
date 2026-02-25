package com.tvds.service;

import com.tvds.model.Fine;
import com.tvds.model.PaymentStatus;
import com.tvds.repository.FineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FineService {

    private final FineRepository fineRepository;

    public List<Fine> getAllFines() {
        return fineRepository.findAll();
    }

    public List<Fine> getFinesByUser(Long userId) {
        return fineRepository.findByViolationReportedById(userId);
    }

    public Fine getFineByViolation(Long violationId) {
        return fineRepository.findByViolationId(violationId)
                .orElseThrow(() -> new RuntimeException("Fine not found for violation"));
    }

    public long countPaidFines() {
        return fineRepository.countByPaymentStatus(PaymentStatus.PAID);
    }

    public long countUnpaidFines() {
        return fineRepository.countByPaymentStatus(PaymentStatus.UNPAID);
    }
}
