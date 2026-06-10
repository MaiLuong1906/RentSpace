package com.rentspace.domain.deposit;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DepositTransactionEventRepository extends JpaRepository<DepositTransactionEvent, Long> {
    
    List<DepositTransactionEvent> findByTransactionIdOrderByCreatedAtDesc(Long transactionId);
}
