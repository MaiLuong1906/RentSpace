package com.rentspace.domain.listing;

import com.rentspace.domain.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "promoted_listings", indexes = {
    @Index(name = "idx_promoted_active", columnList = "is_active, expires_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromotedListing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "landlord_id", nullable = false)
    private User landlord;

    @CreationTimestamp
    @Column(name = "starts_at", nullable = false, updatable = false)
    private LocalDateTime startsAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "amount_paid", nullable = false)
    private Long amountPaid;

    @Column(name = "payment_ref")
    private String paymentRef;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
}
