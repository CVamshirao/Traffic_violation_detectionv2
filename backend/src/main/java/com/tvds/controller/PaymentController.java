package com.tvds.controller;

import com.tvds.dto.ApiResponse;
import com.tvds.dto.PaymentRequest;
import com.tvds.model.Payment;
import com.tvds.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    public ResponseEntity<ApiResponse> makePayment(@Valid @RequestBody PaymentRequest request) {
        try {
            Payment payment = paymentService.processPayment(request);
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("id", payment.getId());
            data.put("fineId", payment.getFine().getId());
            data.put("paymentDate", payment.getPaymentDate().toString());
            data.put("paymentMethod", payment.getPaymentMethod());
            data.put("transactionRef", payment.getTransactionRef());
            return ResponseEntity.ok(ApiResponse.success("Payment successful", data));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse> getPayments() {
        List<Payment> payments = paymentService.getAllPayments();
        List<Map<String, Object>> data = payments.stream().map(p -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", p.getId());
            map.put("fineId", p.getFine().getId());
            map.put("amount", p.getFine().getAmount());
            map.put("paymentDate", p.getPaymentDate().toString());
            map.put("paymentMethod", p.getPaymentMethod());
            map.put("transactionRef", p.getTransactionRef());
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Payments retrieved", data));
    }
}
