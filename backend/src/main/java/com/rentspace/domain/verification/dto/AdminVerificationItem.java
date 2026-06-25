package com.rentspace.domain.verification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminVerificationItem {
    private Long id;
    private Long userId;
    private String userEmail;
    private String userFullName;
    private String status;
    private String maskedId;
    private String fullName;
    private BigDecimal confidence;
    private String rejectionReason;
    private Instant createdAt;
}
