package com.rentspace.domain.listing;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ListingViewRepository extends JpaRepository<ListingView, Long> {
    
    long countByListingId(Long listingId);
    
    boolean existsByListingIdAndViewerIdAndViewedAtAfter(Long listingId, Long viewerId, LocalDateTime after);
    
    long countByListing_Landlord_IdAndViewedAtAfter(Long landlordId, LocalDateTime since);

    @Query(value = """
            SELECT CAST(v.viewed_at AS date) as viewDate, COUNT(*) as viewCount
            FROM listing_views v
            JOIN listings l ON v.listing_id = l.id
            WHERE l.landlord_id = :landlordId AND v.viewed_at >= :since
            GROUP BY CAST(v.viewed_at AS date)
            ORDER BY viewDate ASC
            """, nativeQuery = true)
    List<Object[]> findDailyViewsForLandlord(@Param("landlordId") Long landlordId, @Param("since") LocalDateTime since);
}
