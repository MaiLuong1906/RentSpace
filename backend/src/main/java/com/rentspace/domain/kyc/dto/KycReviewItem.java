package com.rentspace.domain.kyc.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Thông tin KYC đầy đủ cho admin review.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KycReviewItem {
    private Long userId;
    private String email;
    private String fullName;
    private String kycStatus;
    private String cccdImageUrl;
    private LocalDateTime submittedAt;  // updatedAt khi status = PENDING
}
