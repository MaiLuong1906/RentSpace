package com.rentspace.domain.deposit.dto;

import com.rentspace.domain.deposit.enums.DisputeReason;
import com.rentspace.domain.deposit.enums.DisputeStatus;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class DisputeResponse {
    private Long id;
    private Long transactionId;
    private Long openedById;
    private String openedByName;
    private DisputeReason reason;
    private String description;
    private List<String> evidenceUrls;
    private DisputeStatus status;
    private String resolutionNote;
    private Long resolvedById;
    private String resolvedByName;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;
}
