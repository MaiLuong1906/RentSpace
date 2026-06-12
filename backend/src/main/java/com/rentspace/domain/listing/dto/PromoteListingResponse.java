package com.rentspace.domain.listing.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PromoteListingResponse {
    private String paymentUrl;
    private Long amount;
}
