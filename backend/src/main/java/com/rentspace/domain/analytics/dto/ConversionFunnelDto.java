package com.rentspace.domain.analytics.dto;

public record ConversionFunnelDto(
        long totalViews,
        long totalChats,
        long totalDeposits,
        long successfulDeals
) {}
