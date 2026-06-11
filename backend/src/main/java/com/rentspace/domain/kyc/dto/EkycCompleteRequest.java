package com.rentspace.domain.kyc.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EkycCompleteRequest {

    @NotBlank(message = "Session ID không được trống")
    private String sessionId;

    private String cccdFrontImage; // Base64-encoded string
    private String cccdBackImage;  // Base64-encoded string
    private String faceImage;      // Base64-encoded string

    @Valid
    private OcrData ocrData;

    private String simulationMode; // "SUCCESS", "NEED_REVIEW", "FAIL"

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OcrData {
        private String idNumber;
        private String fullName;
        private String dateOfBirth;
        private String gender;
        private String hometown;
    }
}
