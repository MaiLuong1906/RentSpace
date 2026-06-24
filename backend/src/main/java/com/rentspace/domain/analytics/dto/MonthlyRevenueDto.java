package com.rentspace.domain.analytics.dto;

public record MonthlyRevenueDto(
        int year,
        int month,
        long revenue,
        int depositCount
) {}
