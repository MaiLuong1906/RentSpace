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
    private String tenantName;     // Tên đầy đủ của người thuê
    private Long landlordId;
    private String landlordName;   // Tên đầy đủ của chủ trọ
    private Long amount;
    private Long platformFee;
    private Long netAmount;
    private DepositStatus status;
    private String paymentMethod;
    private String paymentGatewayRef;
    private String paymentUrl;
    private java.util.Map<String, Object> paymentMethodDetail;
    private java.time.LocalDateTime paidAt;
    private java.time.LocalDateTime releasedAt;
    private java.time.LocalDateTime refundedAt;
    private java.time.LocalDateTime releaseDeadline;
    private LocalDate moveInDate;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String contractUrl;
    private Long contractId;   // ID của hợp đồng kỹ thuật số Phase 4 (null nếu chưa tạo)
}
