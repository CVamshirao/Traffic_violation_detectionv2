package com.tvds.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DashboardStats {
    private long totalViolations;
    private long pendingViolations;
    private long paidFines;
    private long unpaidFines;
}
