package com.rentspace.domain.listing;

import com.rentspace.domain.listing.enums.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PriceBenchmarkRepository extends JpaRepository<PriceBenchmark, Long> {

    Optional<PriceBenchmark> findByCityAndDistrictAndRoomTypeAndAreaBucket(
            String city, String district, RoomType roomType, String areaBucket);

    // Tìm benchmark tốt nhất trong thành phố, loại trừ quận đã tìm thất bại để tránh trả về cùng dữ liệu ít mẫu
    @Query("SELECT pb FROM PriceBenchmark pb WHERE pb.city = :city AND pb.roomType = :roomType AND pb.areaBucket = :areaBucket AND pb.district <> :excludeDistrict ORDER BY pb.sampleCount DESC")
    Optional<PriceBenchmark> findBestCityFallback(
            @Param("city") String city,
            @Param("roomType") RoomType roomType,
            @Param("areaBucket") String areaBucket,
            @Param("excludeDistrict") String excludeDistrict);
}
