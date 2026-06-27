package com.rentspace.domain.search;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ExtractedSearchParams(
        String city,
        String district,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        BigDecimal minArea,
        // "PHONG_TRO" | "CHUNG_CU_MINI" | "CHUNG_CU" | "NGAN_GIAN" | "NHA_NGUYEN_CAN" | null
        String roomType,
        Boolean hasWifi,
        Boolean hasAirConditioner,
        Boolean hasParking,
        Boolean hasWashingMachine,
        // Mô tả không map được vào filter cụ thể, ví dụ "gần ĐH Bách Khoa"
        String keywords
) {
    public static ExtractedSearchParams keywordFallback(String rawQuery) {
        return new ExtractedSearchParams(
                null, null, null, null, null, null,
                null, null, null, null,
                rawQuery
        );
    }
}
