package com.rentspace.domain.recommendation.dto;

import com.rentspace.domain.listing.enums.RoomType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class ListingSummaryDto {
    private Long id;
    private String title;
    private String district;
    private String city;
    private BigDecimal pricePerMonth;
    private BigDecimal areaM2;
    private RoomType roomType;
    private String thumbnail;
}
