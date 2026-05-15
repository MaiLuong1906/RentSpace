package com.rentspace.domain.kyc.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class KycStatusResponse {
    private String status;
    private String cccdImageUrl;
}
