package com.rentspace.domain.listing;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ListingViewRepository extends JpaRepository<ListingView, Long> {
    
    long countByListingId(Long listingId);
    
    boolean existsByListingIdAndViewerIdAndViewedAtAfter(Long listingId, Long viewerId, java.time.LocalDateTime after);
}
