package com.rentspace.domain.analytics.dto;

public record TopLandlordDto(
        Long landlordId,
        String displayName,
        long revenue,
        int dealCount
) {}
