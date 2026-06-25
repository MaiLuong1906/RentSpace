package com.rentspace.domain.contract;

import com.rentspace.common.exception.BusinessException;
import com.rentspace.domain.deposit.DepositTransaction;
import com.rentspace.domain.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(
    name = "contracts",
    uniqueConstraints = @UniqueConstraint(name = "uq_contract_deposit", columnNames = "deposit_id")
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Contract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "deposit_id", nullable = false)
    private DepositTransaction deposit;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "landlord_id", nullable = false)
    private User landlord;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tenant_id", nullable = false)
    private User tenant;

    /** Snapshot nội dung hợp đồng — không đổi sau FULLY_SIGNED */
    @Column(name = "content_snapshot", nullable = false, columnDefinition = "TEXT")
    private String contentSnapshot;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ContractStatus status = ContractStatus.DRAFT;

    @Column(name = "landlord_signed_at")
    private Instant landlordSignedAt;

    @Column(name = "tenant_signed_at")
    private Instant tenantSignedAt;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "pdf_url")
    private String pdfUrl;

    @Column(name = "cancellation_reason")
    private String cancellationReason;

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /**
     * Cập nhật nội dung hợp đồng — CHỈ được phép khi chưa FULLY_SIGNED.
     * Bất biến (immutability guard) sau khi đã ký đủ 2 bên.
     */
    public void updateContent(String newContent) {
        if (status == ContractStatus.FULLY_SIGNED) {
            throw new BusinessException(
                    "Hợp đồng đã được ký đầy đủ và không thể chỉnh sửa.");
        }
        this.contentSnapshot = newContent;
    }
}
