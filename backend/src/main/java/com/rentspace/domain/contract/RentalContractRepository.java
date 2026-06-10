package com.rentspace.domain.contract;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RentalContractRepository extends JpaRepository<RentalContract, Long> {
    
    Optional<RentalContract> findByTransactionId(Long transactionId);
    
    List<RentalContract> findByTenantId(Long tenantId);
    
    List<RentalContract> findByLandlordId(Long landlordId);
}
