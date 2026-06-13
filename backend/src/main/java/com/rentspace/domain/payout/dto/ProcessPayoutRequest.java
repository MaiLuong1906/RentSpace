package com.rentspace.domain.payout.dto;

import com.rentspace.domain.payout.enums.PayoutStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessPayoutRequest {

    @NotNull(message = "Trạng thái giải ngân không được để trống")
    private PayoutStatus status;

    private String bankRef; // Bank transaction reference code

    private String note;    // Rejection reason or processing note
}
