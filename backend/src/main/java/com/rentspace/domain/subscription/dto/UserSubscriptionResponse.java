package com.rentspace.domain.subscription.dto;

import com.rentspace.domain.subscription.enums.SubscriptionStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSubscriptionResponse {
    
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserSubscriptionDetailResponse {
        private Long id;
        private Long userId;
        private String userEmail;
        private SubscriptionPlanResponse plan;
        private SubscriptionStatus status;
        private LocalDateTime startedAt;
        private LocalDateTime expiresAt;
        private String paymentRef;
        private Boolean autoRenew;
        private LocalDateTime createdAt;
    }

    private UserSubscriptionDetailResponse subscription;
    private Long activeListingCount;
    private Boolean limitReached;
}
