package com.rentspace.domain.kyc.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EkycInitResponse {
    private String sessionId;
    private String sdkToken;
}
