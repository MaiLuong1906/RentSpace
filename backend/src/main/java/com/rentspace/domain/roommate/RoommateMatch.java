package com.rentspace.domain.roommate;

import com.rentspace.domain.roommate.enums.MatchStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "roommate_matches", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"profile_a_id", "profile_b_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoommateMatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_a_id", nullable = false)
    private RoommateProfile profileA;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_b_id", nullable = false)
    private RoommateProfile profileB;

    @Column(name = "match_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal matchScore;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private MatchStatus status = MatchStatus.SUGGESTED;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
