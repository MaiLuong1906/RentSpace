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

    List<DepositTransaction> findByLandlordIdAndStatus(Long landlordId, DepositStatus status);

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

    long countByLandlordIdAndPaidAtBetween(Long landlordId, java.time.LocalDateTime from, java.time.LocalDateTime to);

    long countByLandlordIdAndStatusAndReleasedAtBetween(Long landlordId, DepositStatus status,
                                                         java.time.LocalDateTime from, java.time.LocalDateTime to);

    @Query("""
            SELECT EXTRACT(YEAR FROM d.paidAt) AS year,
                   EXTRACT(MONTH FROM d.paidAt) AS month,
                   COUNT(d) AS depositCount,
                   SUM(CASE WHEN d.status = com.rentspace.domain.deposit.enums.DepositStatus.RELEASED THEN d.netAmount ELSE 0L END) AS revenue
            FROM DepositTransaction d
            WHERE d.landlord.id = :landlordId
              AND EXTRACT(YEAR FROM d.paidAt) = :year
              AND d.paidAt IS NOT NULL
            GROUP BY EXTRACT(YEAR FROM d.paidAt), EXTRACT(MONTH FROM d.paidAt)
            ORDER BY EXTRACT(MONTH FROM d.paidAt)
            """)
    List<Object[]> findMonthlyStatsByLandlord(@Param("landlordId") Long landlordId, @Param("year") int year);

    @Query(value = """
            SELECT
                COALESCE(SUM(net_amount), 0)   AS total_revenue,
                COUNT(*)                        AS total_transactions,
                COUNT(DISTINCT landlord_id)     AS active_landlords,
                COALESCE(SUM(platform_fee), 0)  AS platform_fee
            FROM deposit_transactions
            WHERE status = 'RELEASED'
              AND released_at BETWEEN :from AND :to
            """, nativeQuery = true)
    List<Object[]> findAdminSummary(@Param("from") java.time.LocalDateTime from, @Param("to") java.time.LocalDateTime to);

    @Query(value = """
            SELECT
                dt.landlord_id,
                u.full_name,
                SUM(dt.net_amount) AS revenue,
                COUNT(dt.id)       AS deal_count
            FROM deposit_transactions dt
            JOIN users u ON u.id = dt.landlord_id
            WHERE dt.status = 'RELEASED'
              AND dt.released_at BETWEEN :from AND :to
            GROUP BY dt.landlord_id, u.full_name
            ORDER BY revenue DESC
            LIMIT :limitCount
            """, nativeQuery = true)
    List<Object[]> findTopLandlords(@Param("from") java.time.LocalDateTime from,
                                    @Param("to") java.time.LocalDateTime to,
                                    @Param("limitCount") int limitCount);
}

