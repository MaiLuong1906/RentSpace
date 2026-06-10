package com.rentspace.domain.listing;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PromotedListingRepository extends JpaRepository<PromotedListing, Long> {
    
    @Query("SELECT p FROM PromotedListing p WHERE p.isActive = true AND p.expiresAt > :now")
    List<PromotedListing> findAllActive(LocalDateTime now);
    
    List<PromotedListing> findByListingIdAndIsActiveTrue(Long listingId);
}
