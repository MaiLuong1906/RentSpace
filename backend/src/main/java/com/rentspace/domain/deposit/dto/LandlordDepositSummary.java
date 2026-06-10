package com.rentspace.domain.deposit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LandlordDepositSummary {
    private long completedCount;
    private long totalNetAmount;
    private long weeklyNetAmount;
    private long monthlyNetAmount;
}
