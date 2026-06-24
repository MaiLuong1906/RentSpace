package com.rentspace.domain.analytics.dto;

public record AdminFinancialSummaryDto(
        long totalRevenue,
        int totalTransactions,
        int activeLandlords,
        long platformFee
) {}
