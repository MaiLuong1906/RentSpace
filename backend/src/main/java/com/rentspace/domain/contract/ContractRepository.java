package com.rentspace.domain.contract;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface ContractRepository extends JpaRepository<Contract, Long> {

    Optional<Contract> findByDepositId(Long depositId);

    /** Hợp đồng của user (là landlord hoặc tenant) */
    @Query("""
        SELECT c FROM Contract c
        WHERE (c.landlord.id = :userId OR c.tenant.id = :userId)
          AND (:status IS NULL OR c.status = :status)
        ORDER BY c.createdAt DESC
        """)
    Page<Contract> findByUserIdAndStatus(
            @Param("userId") Long userId,
            @Param("status") ContractStatus status,
            Pageable pageable);

    /** Hợp đồng đã hết hạn nhưng chưa chuyển trạng thái EXPIRED */
    List<Contract> findAllByStatusAndExpiresAtBefore(ContractStatus status, Instant now);

    /** DRAFT quá 24h → chuyển sang PENDING_SIGNATURES */
    List<Contract> findAllByStatusAndCreatedAtBefore(ContractStatus status, Instant before);

    /** Hợp đồng sắp hết hạn (để gửi reminder) */
    @Query("""
        SELECT c FROM Contract c
        WHERE c.status = 'PENDING_SIGNATURES'
          AND c.expiresAt BETWEEN :from AND :to
        """)
    List<Contract> findExpiringSoon(@Param("from") Instant from, @Param("to") Instant to);
}
