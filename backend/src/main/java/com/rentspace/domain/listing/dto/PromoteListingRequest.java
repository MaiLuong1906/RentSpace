package com.rentspace.domain.listing.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PromoteListingRequest {

    @NotNull(message = "Số ngày đẩy tin không được để trống")
    @Min(value = 1, message = "Số ngày đẩy tin tối thiểu là 1")
    private Integer durationDays;
}
