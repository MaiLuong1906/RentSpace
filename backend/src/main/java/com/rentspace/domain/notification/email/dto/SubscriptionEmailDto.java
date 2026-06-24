package com.rentspace.domain.notification.email.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionEmailDto {

    private String recipientName;
    private String planName;
    private LocalDate expiryDate;
    private int daysRemaining;
    private String renewUrl;
}
