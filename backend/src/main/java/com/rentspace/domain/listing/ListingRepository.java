package com.rentspace.domain.listing;

import com.rentspace.domain.listing.enums.ListingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface ListingRepository extends JpaRepository<Listing, Long> {

    @Query("""
            SELECT l FROM Listing l
            WHERE l.status = :status
              AND (CAST(:city AS string) IS NULL OR LOWER(l.city) LIKE LOWER(CONCAT('%', CAST(:city AS string), '%')))
              AND (CAST(:district AS string) IS NULL OR LOWER(l.district) LIKE LOWER(CONCAT('%', CAST(:district AS string), '%')))
              AND (:minPrice IS NULL OR l.pricePerMonth >= :minPrice)
              AND (:maxPrice IS NULL OR l.pricePerMonth <= :maxPrice)
              AND (:minArea IS NULL OR l.areaM2 >= :minArea)
            """)
    Page<Listing> search(
            @Param("status") ListingStatus status,
            @Param("city") String city,
            @Param("district") String district,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("minArea") BigDecimal minArea,
            Pageable pageable
    );

    // Tìm phòng gần đây theo tọa độ (Haversine formula)
    @Query(value = """
            SELECT l.* FROM listings l
            WHERE l.status = 'ACTIVE'
              AND l.latitude IS NOT NULL
              AND l.longitude IS NOT NULL
              AND (
                6371 * acos(
                  cos(radians(:lat)) * cos(radians(l.latitude))
                  * cos(radians(l.longitude) - radians(:lng))
                  + sin(radians(:lat)) * sin(radians(l.latitude))
                )
              ) <= :radiusKm
            ORDER BY (
                6371 * acos(
                  cos(radians(:lat)) * cos(radians(l.latitude))
                  * cos(radians(l.longitude) - radians(:lng))
                  + sin(radians(:lat)) * sin(radians(l.latitude))
                )
            ) ASC
            LIMIT :limit
            """, nativeQuery = true)
    List<Listing> findNearby(
            @Param("lat") double lat,
            @Param("lng") double lng,
            @Param("radiusKm") double radiusKm,
            @Param("limit") int limit
    );

    // Tìm listing theo ID (chỉ lấy các tin không bị DELETED)
    Optional<Listing> findByIdAndStatusNot(Long id, ListingStatus status);

    // Lấy tất cả tin của một landlord qua ID
    Page<Listing> findByLandlordIdAndStatusNot(Long landlordId, ListingStatus status, Pageable pageable);

    // Lấy tất cả tin của một landlord qua Email (dành cho API getMyListings)
    Page<Listing> findByLandlord_EmailAndStatusNot(String email, ListingStatus status, Pageable pageable);

    // Lấy tất cả tin của một landlord qua Email và Status cụ thể
    Page<Listing> findByLandlord_EmailAndStatus(String email, ListingStatus status, Pageable pageable);

    // [ADMIN] Lấy tất cả listing theo status cụ thể
    Page<Listing> findByStatus(ListingStatus status, Pageable pageable);

    // [ADMIN] Lấy tất cả listing trừ một status nhất định
    Page<Listing> findByStatusNot(ListingStatus status, Pageable pageable);
}
