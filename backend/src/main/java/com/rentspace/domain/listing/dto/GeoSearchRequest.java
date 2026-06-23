package com.rentspace.domain.listing.dto;

import com.rentspace.domain.listing.enums.RoomType;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class GeoSearchRequest {
    // 1. Polygon search
    private List<CoordinateDTO> polygon; // Danh sách tọa độ Lat/Lng khép kín hoặc hở (chúng ta sẽ khép kín nó ở backend)

    // 2. Circular radius search
    private Double radiusKm;
    private BigDecimal centerLat;
    private BigDecimal centerLng;

    // 3. Additional filters (kế thừa từ Sprint 3)
    private RoomType roomType;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private BigDecimal minArea;
}
