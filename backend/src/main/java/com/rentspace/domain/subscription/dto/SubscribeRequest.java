package com.rentspace.domain.subscription.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscribeRequest {
    @NotNull(message = "ID gói cước không được để trống")
    private Integer planId;
    
    @Builder.Default
    private Boolean autoRenew = false;
}
