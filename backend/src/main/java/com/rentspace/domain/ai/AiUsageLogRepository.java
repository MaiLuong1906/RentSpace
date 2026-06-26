package com.rentspace.domain.ai;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;

public interface AiUsageLogRepository extends JpaRepository<AiUsageLog, Long> {

    int countByUserIdAndContractIdAndFeatureAndCreatedAtAfter(
            Long userId,
            Long contractId,
            String feature,
            Instant after
    );
}
