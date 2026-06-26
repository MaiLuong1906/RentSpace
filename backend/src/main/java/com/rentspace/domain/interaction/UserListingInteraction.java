package com.rentspace.domain.interaction;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "user_listing_interactions", indexes = {
        @Index(name = "idx_interactions_user",    columnList = "user_id,created_at DESC"),
        @Index(name = "idx_interactions_listing", columnList = "listing_id,interaction_type"),
        @Index(name = "idx_interactions_session", columnList = "session_id,created_at DESC")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserListingInteraction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "session_id", length = 100)
    private String sessionId;

    @Column(name = "listing_id", nullable = false)
    private Long listingId;

    @Enumerated(EnumType.STRING)
    @Column(name = "interaction_type", nullable = false, length = 20)
    private InteractionType interactionType;

    @Column(name = "view_duration_sec")
    private Integer viewDurationSec;

    @Column(name = "referrer", length = 50)
    private String referrer;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
