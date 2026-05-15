package com.rentspace.domain.listing.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ListingImageResponse {
    private Long id;
    private String imageUrl;
    private Integer displayOrder;
}
