package com.rentspace.domain.payout.dto;

import com.rentspace.domain.payout.enums.PayoutStatus;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayoutResponse {
    private Long id;
    private Long landlordId;
    private String landlordName;
    private String bankName;
    private String bankCode;
    private String accountNumber; // Masked for security: ******5678
    private String accountName;
    private Long depositId;
    private String listingTitle;
    private Long amount;
    private Long fee;
    private Long netAmount;
    private PayoutStatus status;
    private String bankRef;
    private LocalDateTime processedAt;
    private String note;
    private String processedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
