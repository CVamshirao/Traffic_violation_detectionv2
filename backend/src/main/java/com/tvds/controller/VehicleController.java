package com.tvds.controller;

import com.tvds.dto.*;
import com.tvds.model.User;
import com.tvds.model.Vehicle;
import com.tvds.service.VehicleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;

    @PostMapping
    public ResponseEntity<ApiResponse> addVehicle(@Valid @RequestBody VehicleRequest request,
            @AuthenticationPrincipal User user) {
        try {
            Vehicle vehicle = vehicleService.addVehicle(request, user);
            return ResponseEntity.ok(ApiResponse.success("Vehicle added successfully", toMap(vehicle)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse> getVehicles(@AuthenticationPrincipal User user) {
        List<Vehicle> vehicles;
        if (user.getRole().name().equals("ADMIN") || user.getRole().name().equals("OFFICER")) {
            vehicles = vehicleService.getAllVehicles();
        } else {
            vehicles = vehicleService.getUserVehicles(user.getId());
        }
        List<Map<String, Object>> data = vehicles.stream().map(this::toMap).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Vehicles retrieved", data));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse> updateVehicle(@PathVariable Long id,
            @Valid @RequestBody VehicleRequest request,
            @AuthenticationPrincipal User user) {
        try {
            Vehicle vehicle = vehicleService.updateVehicle(id, request, user);
            return ResponseEntity.ok(ApiResponse.success("Vehicle updated", toMap(vehicle)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteVehicle(@PathVariable Long id,
            @AuthenticationPrincipal User user) {
        try {
            vehicleService.deleteVehicle(id, user);
            return ResponseEntity.ok(ApiResponse.success("Vehicle deleted"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    private Map<String, Object> toMap(Vehicle v) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", v.getId());
        map.put("plateNumber", v.getPlateNumber());
        map.put("ownerName", v.getOwnerName());
        map.put("vehicleType", v.getVehicleType());
        map.put("userId", v.getUser().getId());
        return map;
    }
}
