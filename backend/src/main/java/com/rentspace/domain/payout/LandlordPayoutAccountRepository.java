package com.rentspace.domain.payout;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LandlordPayoutAccountRepository extends JpaRepository<LandlordPayoutAccount, Long> {
    Optional<LandlordPayoutAccount> findByUserId(Long userId);
    boolean existsByUserId(Long userId);
}
