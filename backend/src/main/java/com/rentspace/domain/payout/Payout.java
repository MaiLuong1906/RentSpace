package com.rentspace.domain.payout;

import com.rentspace.domain.deposit.DepositTransaction;
import com.rentspace.domain.payout.enums.PayoutStatus;
import com.rentspace.domain.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "payouts", indexes = {
        @Index(name = "idx_payouts_landlord", columnList = "landlord_id"),
        @Index(name = "idx_payouts_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payout {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "landlord_id", nullable = false)
    private User landlord;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payout_account_id", nullable = false)
    private LandlordPayoutAccount payoutAccount;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deposit_id", nullable = false, unique = true)
    private DepositTransaction deposit;

    @Column(nullable = false)
    private Long amount;

    @Column(nullable = false)
    @Builder.Default
    private Long fee = 0L;

    @Column(name = "net_amount", nullable = false)
    private Long netAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PayoutStatus status = PayoutStatus.PENDING;

    @Column(name = "bank_ref")
    private String bankRef;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(columnDefinition = "TEXT")
    private String note;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
