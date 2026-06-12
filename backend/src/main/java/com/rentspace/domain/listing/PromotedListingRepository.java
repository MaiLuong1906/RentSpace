package com.rentspace.domain.listing;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PromotedListingRepository extends JpaRepository<PromotedListing, Long> {
    
    @Query("SELECT p FROM PromotedListing p WHERE p.isActive = true AND p.expiresAt > :now")
    List<PromotedListing> findAllActive(LocalDateTime now);
    
    @Query("SELECT p FROM PromotedListing p WHERE p.isActive = true AND p.expiresAt <= :now")
    List<PromotedListing> findAllExpired(LocalDateTime now);
    
    List<PromotedListing> findByListingIdAndIsActiveTrue(Long listingId);

    @Query("SELECT p FROM PromotedListing p WHERE p.listing.id IN :listingIds AND p.isActive = true AND p.expiresAt > :now")
    List<PromotedListing> findActiveByListingIds(@Param("listingIds") List<Long> listingIds, @Param("now") LocalDateTime now);

    @Query("SELECT p FROM PromotedListing p WHERE p.isActive = false AND p.startsAt < :threshold")
    List<PromotedListing> findUnpaidOlderThan(@Param("threshold") LocalDateTime threshold);
}
