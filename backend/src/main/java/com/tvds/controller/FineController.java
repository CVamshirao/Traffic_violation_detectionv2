package com.tvds.controller;

import com.tvds.dto.ApiResponse;
import com.tvds.model.Fine;
import com.tvds.model.Role;
import com.tvds.model.User;
import com.tvds.service.FineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/fines")
@RequiredArgsConstructor
public class FineController {

    private final FineService fineService;

    @GetMapping
    public ResponseEntity<ApiResponse> getFines(@AuthenticationPrincipal User user) {
        List<Fine> fines;
        if (user.getRole() == Role.ADMIN || user.getRole() == Role.OFFICER) {
            fines = fineService.getAllFines();
        } else {
            fines = fineService.getFinesByUser(user.getId());
        }

        List<Map<String, Object>> data = fines.stream().map(this::toMap).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Fines retrieved", data));
    }

    private Map<String, Object> toMap(Fine f) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", f.getId());
        map.put("violationId", f.getViolation().getId());
        map.put("violationType", f.getViolation().getViolationType().getDisplayName());
        map.put("plateNumber", f.getViolation().getVehicle().getPlateNumber());
        map.put("amount", f.getAmount());
        map.put("issuedDate", f.getIssuedDate().toString());
        map.put("paymentStatus", f.getPaymentStatus().name());
        return map;
    }
}
