package com.tvds.dto;

import lombok.Data;
import jakarta.validation.constraints.*;

@Data
public class VehicleRequest {
    @NotBlank
    private String plateNumber;

    @NotBlank
    private String ownerName;

    @NotBlank
    private String vehicleType;
}
