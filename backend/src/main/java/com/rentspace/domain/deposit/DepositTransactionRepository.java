package com.rentspace.domain.deposit;

import com.rentspace.domain.deposit.enums.DepositStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.EntityGraph;

import java.util.List;

@Repository
public interface DepositTransactionRepository extends JpaRepository<DepositTransaction, Long> {
    
    List<DepositTransaction> findByTenantId(Long tenantId);
    
    List<DepositTransaction> findByLandlordId(Long landlordId);
    
    List<DepositTransaction> findByListingIdAndStatus(Long listingId, DepositStatus status);

    @EntityGraph(attributePaths = {"listing", "tenant", "landlord"})
    List<DepositTransaction> findAllByTenantIdOrLandlordIdOrderByCreatedAtDesc(Long tenantId, Long landlordId);

    boolean existsByListingIdAndTenantIdAndStatusIn(Long listingId, Long tenantId, java.util.List<DepositStatus> statuses);
}
