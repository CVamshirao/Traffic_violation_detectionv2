package com.tvds.dto;

import lombok.Data;
import jakarta.validation.constraints.*;

@Data
public class PaymentRequest {
    @NotNull
    private Long fineId;

    @NotBlank
    private String paymentMethod;
}
