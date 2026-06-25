package com.rentspace.domain.review;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRatingSummaryRepository extends JpaRepository<UserRatingSummary, Long> {
    Optional<UserRatingSummary> findByUserId(Long userId);
}
