package com.rentspace.domain.review;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    Page<Review> findByListingId(Long listingId, Pageable pageable);
    Optional<Review> findByListingIdAndTenantId(Long listingId, Long tenantId);
    boolean existsByListingIdAndTenantId(Long listingId, Long tenantId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.listing.id = :listingId")
    Double getAverageRatingForListing(@Param("listingId") Long listingId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.listing.id = :listingId")
    Long getReviewCountForListing(@Param("listingId") Long listingId);

    @Query("SELECT r.listing.id, AVG(r.rating), COUNT(r) FROM Review r WHERE r.listing.id IN :listingIds GROUP BY r.listing.id")
    List<Object[]> getAverageRatingAndCountForListingIds(@Param("listingIds") List<Long> listingIds);
}
