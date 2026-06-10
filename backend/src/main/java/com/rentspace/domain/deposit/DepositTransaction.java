package com.rentspace.domain.deposit;

import com.rentspace.domain.deposit.enums.DepositStatus;
import com.rentspace.domain.listing.Listing;
import com.rentspace.domain.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "deposit_transactions", indexes = {
        @Index(name = "idx_deposit_tx_tenant", columnList = "tenant_id"),
        @Index(name = "idx_deposit_tx_landlord", columnList = "landlord_id"),
        @Index(name = "idx_deposit_tx_status", columnList = "status"),
        @Index(name = "idx_deposit_tx_listing", columnList = "listing_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepositTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private User tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "landlord_id", nullable = false)
    private User landlord;

    @Column(nullable = false)
    private Long amount;            // VND nguyên

    @Column(name = "platform_fee", nullable = false)
    private Long platformFee;

    @Column(name = "net_amount", nullable = false)
    private Long netAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private DepositStatus status = DepositStatus.PENDING_PAYMENT;

    @Column(name = "payment_method", length = 20)
    private String paymentMethod;   // 'VNPAY'

    @Column(name = "payment_gateway_ref")
    private String paymentGatewayRef;

    @Column(name = "payment_url", columnDefinition = "TEXT")
    private String paymentUrl;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "released_at")
    private LocalDateTime releasedAt;

    @Column(name = "refunded_at")
    private LocalDateTime refundedAt;

    @Column(name = "release_deadline")
    private LocalDateTime releaseDeadline;

    @Column(name = "move_in_date")
    private LocalDate moveInDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
