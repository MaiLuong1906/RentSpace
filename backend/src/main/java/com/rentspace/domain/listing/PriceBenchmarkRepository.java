package com.rentspace.domain.listing;

import com.rentspace.domain.listing.enums.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PriceBenchmarkRepository extends JpaRepository<PriceBenchmark, Long> {

    Optional<PriceBenchmark> findByCityAndDistrictAndRoomTypeAndAreaBucket(
            String city, String district, RoomType roomType, String areaBucket);

    Optional<PriceBenchmark> findFirstByCityAndRoomTypeAndAreaBucketOrderBySampleCountDesc(
            String city, RoomType roomType, String areaBucket);
}
