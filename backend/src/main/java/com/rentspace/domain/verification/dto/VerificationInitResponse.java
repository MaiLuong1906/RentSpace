package com.rentspace.domain.verification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerificationInitResponse {
    private String faceToken;
    private String maskedId;
    private String fullName;
}
