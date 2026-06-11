package com.rentspace.infrastructure.ekyc;

import com.rentspace.domain.kyc.dto.EkycCompleteRequest;
import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@Slf4j
public class VnptEkycService {

    public EkycVerificationResult verify(EkycCompleteRequest request) {
        log.info("Processing simulated VNPT eKYC verification for session: {}", request.getSessionId());

        String mode = request.getSimulationMode();
        if (mode == null) {
            mode = "SUCCESS";
        }

        BigDecimal confidence;
        boolean isSuccess;
        String reason;

        switch (mode.toUpperCase()) {
            case "SUCCESS":
                confidence = new BigDecimal("92.45");
                isSuccess = true;
                reason = "Face matched successfully";
                break;
            case "NEED_REVIEW":
                confidence = new BigDecimal("71.20");
                isSuccess = true;
                reason = "Face match low confidence (lighting or image quality)";
                break;
            case "FAIL":
                confidence = new BigDecimal("42.50");
                isSuccess = false;
                reason = "Face match score below threshold (possible mismatch or spoof)";
                break;
            default:
                log.error("Simulated VNPT eKYC service gateway timeout/error for mode: {}", mode);
                throw new RuntimeException("VNPT eKYC service gateway timeout or connection failure");
        }

        return EkycVerificationResult.builder()
                .sessionId(request.getSessionId())
                .transactionId(UUID.randomUUID().toString())
                .confidence(confidence)
                .isSuccess(isSuccess)
                .reason(reason)
                .ocrData(request.getOcrData())
                .build();
    }

    @Data
    @Builder
    public static class EkycVerificationResult {
        private String sessionId;
        private String transactionId;
        private BigDecimal confidence;
        private boolean isSuccess;
        private String reason;
        private EkycCompleteRequest.OcrData ocrData;
    }
}
