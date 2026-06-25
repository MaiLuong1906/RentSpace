package com.rentspace.domain.verification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerificationStatusDto {
    private String status;
    private String maskedId;
    private String fullName;
    private Instant verifiedAt;
    private String rejectionReason;
}
