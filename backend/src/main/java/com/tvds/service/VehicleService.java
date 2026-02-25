package com.tvds.service;

import com.tvds.dto.VehicleRequest;
import com.tvds.model.User;
import com.tvds.model.Vehicle;
import com.tvds.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepository vehicleRepository;

    public Vehicle addVehicle(VehicleRequest request, User user) {
        if (vehicleRepository.existsByPlateNumber(request.getPlateNumber())) {
            throw new RuntimeException("Vehicle with this plate number already exists");
        }

        Vehicle vehicle = Vehicle.builder()
                .plateNumber(request.getPlateNumber())
                .ownerName(request.getOwnerName())
                .vehicleType(request.getVehicleType())
                .user(user)
                .build();

        return vehicleRepository.save(vehicle);
    }

    public List<Vehicle> getUserVehicles(Long userId) {
        return vehicleRepository.findByUserId(userId);
    }

    public List<Vehicle> getAllVehicles() {
        return vehicleRepository.findAll();
    }

    public Vehicle updateVehicle(Long id, VehicleRequest request, User user) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        if (!vehicle.getUser().getId().equals(user.getId()) &&
                !user.getRole().name().equals("ADMIN")) {
            throw new RuntimeException("Unauthorized");
        }

        vehicle.setPlateNumber(request.getPlateNumber());
        vehicle.setOwnerName(request.getOwnerName());
        vehicle.setVehicleType(request.getVehicleType());
        return vehicleRepository.save(vehicle);
    }

    public void deleteVehicle(Long id, User user) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        if (!vehicle.getUser().getId().equals(user.getId()) &&
                !user.getRole().name().equals("ADMIN")) {
            throw new RuntimeException("Unauthorized");
        }

        vehicleRepository.delete(vehicle);
    }
}
