package com.rentspace.domain.deposit;

import com.rentspace.domain.deposit.enums.DepositStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

@Repository
public interface DepositTransactionRepository extends JpaRepository<DepositTransaction, Long> {
    
    List<DepositTransaction> findByTenantId(Long tenantId);
    
    List<DepositTransaction> findByLandlordId(Long landlordId);
    
    List<DepositTransaction> findByListingIdAndStatus(Long listingId, DepositStatus status);

    @EntityGraph(attributePaths = {"listing", "tenant", "landlord"})
    List<DepositTransaction> findAllByTenantIdOrLandlordIdOrderByCreatedAtDesc(Long tenantId, Long landlordId);

    boolean existsByListingIdAndTenantIdAndStatusIn(Long listingId, Long tenantId, java.util.List<DepositStatus> statuses);

    List<DepositTransaction> findAllByStatusAndReleaseDeadlineBefore(DepositStatus status, java.time.LocalDateTime dateTime);

    @Query("SELECT COUNT(d) FROM DepositTransaction d WHERE d.landlord.id = :landlordId AND d.status = com.rentspace.domain.deposit.enums.DepositStatus.RELEASED")
    long countCompletedDepositsByLandlordId(@Param("landlordId") Long landlordId);

    @Query("SELECT COALESCE(SUM(d.netAmount), 0L) FROM DepositTransaction d WHERE d.landlord.id = :landlordId AND d.status = com.rentspace.domain.deposit.enums.DepositStatus.RELEASED")
    long sumTotalNetAmountByLandlordId(@Param("landlordId") Long landlordId);

    @Query("SELECT COALESCE(SUM(d.netAmount), 0L) FROM DepositTransaction d WHERE d.landlord.id = :landlordId AND d.status = com.rentspace.domain.deposit.enums.DepositStatus.RELEASED AND d.releasedAt >= :startDate")
    long sumNetAmountByLandlordIdAndReleasedAtAfter(@Param("landlordId") Long landlordId, @Param("startDate") java.time.LocalDateTime startDate);

    long countByLandlordIdAndPaidAtAfter(Long landlordId, java.time.LocalDateTime since);
}

