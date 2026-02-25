package com.tvds.repository;

import com.tvds.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    List<Vehicle> findByUserId(Long userId);

    boolean existsByPlateNumber(String plateNumber);

    java.util.Optional<Vehicle> findByPlateNumber(String plateNumber);
}
