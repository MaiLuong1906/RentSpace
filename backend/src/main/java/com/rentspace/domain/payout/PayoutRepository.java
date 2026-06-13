package com.rentspace.domain.payout;

import com.rentspace.domain.payout.enums.PayoutStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PayoutRepository extends JpaRepository<Payout, Long> {
    Page<Payout> findAllByLandlordId(Long landlordId, Pageable pageable);
    
    Page<Payout> findAllByStatus(PayoutStatus status, Pageable pageable);
    
    boolean existsByDepositId(Long depositId);
    
    Optional<Payout> findByDepositId(Long depositId);
}
