package com.rentspace.domain.notification.email.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DisputeEmailDto {

    private String recipientName;
    private String listingTitle;
    private String disputeReason;
    private String submittedByName;
    private String disputeDetailUrl;
}
