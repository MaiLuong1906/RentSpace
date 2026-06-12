package com.rentspace.domain.listing.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PromotedListingStatusResponse {
    private Boolean isActive;
    private LocalDateTime startsAt;
    private LocalDateTime expiresAt;
}
