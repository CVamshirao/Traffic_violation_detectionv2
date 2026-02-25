package com.tvds.service;

import com.tvds.dto.PaymentRequest;
import com.tvds.model.Fine;
import com.tvds.model.Payment;
import com.tvds.model.PaymentStatus;
import com.tvds.repository.FineRepository;
import com.tvds.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final FineRepository fineRepository;

    @Transactional
    public Payment processPayment(PaymentRequest request) {
        Fine fine = fineRepository.findById(request.getFineId())
                .orElseThrow(() -> new RuntimeException("Fine not found"));

        if (fine.getPaymentStatus() == PaymentStatus.PAID) {
            throw new RuntimeException("Fine is already paid");
        }

        if (paymentRepository.existsByFineId(request.getFineId())) {
            throw new RuntimeException("Payment already exists for this fine");
        }

        // Update fine status
        fine.setPaymentStatus(PaymentStatus.PAID);
        fineRepository.save(fine);

        // Create payment record
        Payment payment = Payment.builder()
                .fine(fine)
                .paymentDate(LocalDateTime.now())
                .paymentMethod(request.getPaymentMethod())
                .transactionRef("TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .build();

        return paymentRepository.save(payment);
    }

    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }
}
