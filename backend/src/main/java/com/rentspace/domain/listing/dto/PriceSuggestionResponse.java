package com.rentspace.domain.listing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PriceSuggestionResponse {
    private Long p25Price;
    private Long p50Price;
    private Long p75Price;
    private Integer sampleCount;
    private String dataSource;
    private Boolean isFallback;
}
