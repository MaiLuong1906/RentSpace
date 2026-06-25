package com.rentspace.domain.review.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class RatingSummaryResponse {
    private Long userId;
    private Integer totalReviews;
    private BigDecimal averageRating;
    private Integer rating1Count;
    private Integer rating2Count;
    private Integer rating3Count;
    private Integer rating4Count;
    private Integer rating5Count;
}
