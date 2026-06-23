package com.rentspace.domain.listing;

import com.rentspace.domain.listing.enums.ListingStatus;
import com.rentspace.domain.listing.enums.RoomType;
import com.rentspace.domain.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "listings", indexes = {
        @Index(name = "idx_listing_landlord", columnList = "landlord_id"),
        @Index(name = "idx_listing_status", columnList = "status"),
        @Index(name = "idx_listing_location", columnList = "latitude,longitude")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Listing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "landlord_id", nullable = false)
    private User landlord;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    // ===== Địa chỉ =====
    @Column(nullable = false)
    private String address;

    @Column
    private String ward;        // Phường/Xã

    @Column
    private String district;    // Quận/Huyện

    @Column
    private String city;        // Tỉnh/Thành phố

    @Column(precision = 10, scale = 8)
    private BigDecimal latitude;

    @Column(precision = 11, scale = 8)
    private BigDecimal longitude;

    // ===== Thông tin phòng =====
    @Column(name = "price_per_month", nullable = false, precision = 15, scale = 2)
    private BigDecimal pricePerMonth;

    @Column(name = "area_m2", precision = 6, scale = 2)
    private BigDecimal areaM2;          // Diện tích (m²)

    @Column(name = "num_bedrooms")
    private Integer numBedrooms;

    @Column(name = "num_bathrooms")
    private Integer numBathrooms;

    // ===== Tiện ích =====
    @Column(name = "has_wifi")
    @Builder.Default
    private Boolean hasWifi = false;

    @Column(name = "has_parking")
    @Builder.Default
    private Boolean hasParking = false;

    @Column(name = "has_air_conditioner")
    @Builder.Default
    private Boolean hasAirConditioner = false;

    @Column(name = "has_washing_machine")
    @Builder.Default
    private Boolean hasWashingMachine = false;

    @Column(name = "allow_pets")
    @Builder.Default
    private Boolean allowPets = false;

    // ===== Loại phòng =====
    @Enumerated(EnumType.STRING)
    @Column(name = "room_type", nullable = false)
    @Builder.Default
    private RoomType roomType = RoomType.PHONG_TRO;

    // ===== Trạng thái =====
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ListingStatus status = ListingStatus.DRAFT;

    // ===== Ảnh (1-N) =====
    @OneToMany(mappedBy = "listing", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ListingImage> images = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
