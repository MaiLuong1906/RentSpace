package com.rentspace.domain.listing.dto;

import com.rentspace.domain.listing.enums.ListingStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateListingStatusRequest {
    @NotNull(message = "Trạng thái không được để trống")
    private ListingStatus status;
}
