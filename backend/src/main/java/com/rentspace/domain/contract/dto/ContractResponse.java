package com.rentspace.domain.contract.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class ContractResponse {
    private Long id;
    private Long depositId;
    private Long landlordId;
    private String landlordName;
    private Long tenantId;
    private String tenantName;
    private String contentSnapshot;
    private String status;
    private Instant landlordSignedAt;
    private Instant tenantSignedAt;
    private Instant expiresAt;
    private String pdfUrl;
    private String cancellationReason;
    private Instant createdAt;
}
