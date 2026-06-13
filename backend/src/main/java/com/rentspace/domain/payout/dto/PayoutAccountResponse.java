package com.rentspace.domain.payout.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayoutAccountResponse {
    private Long id;
    private String bankName;
    private String bankCode;
    private String accountNumber; // Masked for security: ******5678
    private String accountName;
    private Boolean isVerified;
    private LocalDateTime verifiedAt;
    private LocalDateTime createdAt;
}
