package com.rentspace.domain.interaction;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SavedListingRepository extends JpaRepository<SavedListing, SavedListingId> {

    @Query(value = "SELECT sl FROM SavedListing sl WHERE sl.id.userId = :userId ORDER BY sl.createdAt DESC",
           countQuery = "SELECT COUNT(sl) FROM SavedListing sl WHERE sl.id.userId = :userId")
    Page<SavedListing> findAllByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT CASE WHEN COUNT(sl) > 0 THEN true ELSE false END FROM SavedListing sl WHERE sl.id.userId = :userId AND sl.id.listingId = :listingId")
    boolean existsByUserIdAndListingId(@Param("userId") Long userId, @Param("listingId") Long listingId);

    @Query("SELECT COUNT(sl) FROM SavedListing sl WHERE sl.id.listingId = :listingId")
    int countByListingId(@Param("listingId") Long listingId);
}
