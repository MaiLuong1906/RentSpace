package com.rentspace.domain.subscription.dto;

import com.rentspace.domain.subscription.enums.AnalyticsLevel;
import com.rentspace.domain.subscription.enums.PlanName;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPlanResponse {
    private Integer id;
    private PlanName name;
    private String displayName;
    private Long price;
    private Integer durationDays;
    private Integer maxListings;
    private Integer maxImages;
    private Integer boostCredits;
    private AnalyticsLevel analyticsLevel;
}
