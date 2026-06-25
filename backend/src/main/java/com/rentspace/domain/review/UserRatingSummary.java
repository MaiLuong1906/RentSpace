package com.rentspace.domain.review;

import com.rentspace.domain.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "user_rating_summary")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserRatingSummary {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Builder.Default
    @Column(name = "total_reviews", nullable = false)
    private Integer totalReviews = 0;

    @Builder.Default
    @Column(name = "average_rating", nullable = false, precision = 3, scale = 2)
    private BigDecimal averageRating = BigDecimal.ZERO;

    @Builder.Default @Column(name = "rating_1_count", nullable = false) private Integer rating1Count = 0;
    @Builder.Default @Column(name = "rating_2_count", nullable = false) private Integer rating2Count = 0;
    @Builder.Default @Column(name = "rating_3_count", nullable = false) private Integer rating3Count = 0;
    @Builder.Default @Column(name = "rating_4_count", nullable = false) private Integer rating4Count = 0;
    @Builder.Default @Column(name = "rating_5_count", nullable = false) private Integer rating5Count = 0;

    @Builder.Default
    @Column(name = "last_updated", nullable = false)
    private Instant lastUpdated = Instant.now();

    public void incrementRating(short rating) {
        switch (rating) {
            case 1 -> rating1Count++;
            case 2 -> rating2Count++;
            case 3 -> rating3Count++;
            case 4 -> rating4Count++;
            case 5 -> rating5Count++;
        }
        totalReviews++;
        recalcAverage();
        lastUpdated = Instant.now();
    }

    private void recalcAverage() {
        if (totalReviews == 0) { averageRating = BigDecimal.ZERO; return; }
        long sum = (long) rating1Count
                 + (long) rating2Count * 2
                 + (long) rating3Count * 3
                 + (long) rating4Count * 4
                 + (long) rating5Count * 5;
        averageRating = BigDecimal.valueOf((double) sum / totalReviews)
                .setScale(2, java.math.RoundingMode.HALF_UP);
    }
}
