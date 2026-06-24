package com.rentspace.domain.notification.email.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepositEmailDto {

    private String recipientName;
    private String listingTitle;
    private String listingAddress;
    private BigDecimal depositAmount;
    private String counterpartName;
    private String depositDetailUrl;
}
