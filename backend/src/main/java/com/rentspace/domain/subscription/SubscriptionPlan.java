package com.rentspace.domain.subscription;

import com.rentspace.domain.subscription.enums.AnalyticsLevel;
import com.rentspace.domain.subscription.enums.PlanName;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "subscription_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true, length = 50)
    private PlanName name;

    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;

    @Column(nullable = false)
    @Builder.Default
    private Long price = 0L;

    @Column(name = "duration_days", nullable = false)
    private Integer durationDays;

    @Column(name = "max_listings", nullable = false)
    @Builder.Default
    private Integer maxListings = 10;

    @Column(name = "max_images", nullable = false)
    @Builder.Default
    private Integer maxImages = 5;

    @Column(name = "boost_credits", nullable = false)
    @Builder.Default
    private Integer boostCredits = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "analytics_level", nullable = false, length = 20)
    @Builder.Default
    private AnalyticsLevel analyticsLevel = AnalyticsLevel.BASIC;
}
