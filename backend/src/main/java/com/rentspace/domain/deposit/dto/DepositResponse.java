package com.rentspace.domain.deposit.dto;

import com.rentspace.domain.deposit.enums.DepositStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class DepositResponse {
    private Long id;
    private Long listingId;
    private String listingTitle;
    private Long tenantId;
    private Long landlordId;
    private Long amount;
    private Long platformFee;
    private Long netAmount;
    private DepositStatus status;
    private String paymentUrl;
    private LocalDate moveInDate;
    private LocalDateTime createdAt;
}
