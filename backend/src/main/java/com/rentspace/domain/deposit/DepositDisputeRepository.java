package com.rentspace.domain.deposit;

import com.rentspace.domain.deposit.enums.DisputeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepositDisputeRepository extends JpaRepository<DepositDispute, Long> {
    
    Optional<DepositDispute> findByTransactionId(Long transactionId);
    
    List<DepositDispute> findByStatus(DisputeStatus status);
    
    List<DepositDispute> findByOpenedById(Long userId);
}
