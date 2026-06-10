package com.rentspace.domain.deposit.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class DepositRequest {
    @NotNull(message = "Listing ID is required")
    private Long listingId;

    @NotNull(message = "Amount is required")
    @Min(value = 10000, message = "Minimum deposit amount is 10,000 VND")
    private Long amount;

    private LocalDate moveInDate;

    private String notes;
}
