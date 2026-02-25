package com.tvds.dto;

import lombok.Data;
import jakarta.validation.constraints.*;

@Data
public class ViolationRequest {
    @NotNull
    private Long vehicleId;

    @NotBlank
    private String violationType;

    @NotBlank
    private String location;
}
