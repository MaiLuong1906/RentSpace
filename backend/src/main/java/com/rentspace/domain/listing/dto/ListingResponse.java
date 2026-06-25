package com.rentspace.domain.listing.dto;

import com.rentspace.domain.listing.enums.ListingStatus;
import com.rentspace.domain.listing.enums.RoomType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ListingResponse {
    private Long id;
    private Long landlordId;
    private String landlordName;
    private String landlordAvatar;
    private Boolean landlordIsVerified;

    private String title;
    private String description;

    private String address;
    private String ward;
    private String district;
    private String city;
    private BigDecimal latitude;
    private BigDecimal longitude;

    private BigDecimal pricePerMonth;
    private BigDecimal areaM2;
    private Integer numBedrooms;
    private Integer numBathrooms;

    private Boolean hasWifi;
    private Boolean hasParking;
    private Boolean hasAirConditioner;
    private Boolean hasWashingMachine;
    private Boolean allowPets;

    private RoomType roomType;

    private ListingStatus status;
    private List<ListingImageResponse> images;

    private Double averageRating;
    private Integer reviewCount;

    private Boolean isPromoted;
    private LocalDateTime promotedExpiresAt;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

