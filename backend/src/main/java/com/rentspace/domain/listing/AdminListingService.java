package com.rentspace.domain.listing;

import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.domain.listing.dto.ListingImageResponse;
import com.rentspace.domain.listing.dto.ListingResponse;
import com.rentspace.domain.listing.enums.ListingStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AdminListingService {

    private final ListingRepository listingRepository;

    // ===== [ADMIN] GET tất cả listing (mọi status trừ DELETED nếu status=null) =====
    public Page<ListingResponse> getAllListings(ListingStatus status, Pageable pageable) {
        if (status != null) {
            // Lọc theo status cụ thể (bao gồm cả DELETED nếu admin muốn)
            return listingRepository.findByStatus(status, pageable)
                    .map(this::mapToResponse);
        }
        // Mặc định: lấy tất cả trừ DELETED
        return listingRepository.findByStatusNot(ListingStatus.DELETED, pageable)
                .map(this::mapToResponse);
    }

    // ===== [ADMIN] Cập nhật status của bất kỳ listing nào =====
    @Transactional
    public ListingResponse updateStatus(Long id, ListingStatus newStatus) {
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tin đăng với id: " + id));

        ListingStatus oldStatus = listing.getStatus();
        listing.setStatus(newStatus);
        Listing saved = listingRepository.save(listing);

        log.info("[ADMIN] Cập nhật trạng thái tin đăng id={} từ {} → {}", id, oldStatus, newStatus);
        return mapToResponse(saved);
    }

    // ===== Private Helpers =====
    private ListingResponse mapToResponse(Listing listing) {
        return ListingResponse.builder()
                .id(listing.getId())
                .landlordId(listing.getLandlord().getId())
                .landlordName(listing.getLandlord().getFullName())
                .landlordAvatar(listing.getLandlord().getAvatarUrl())
                .title(listing.getTitle())
                .description(listing.getDescription())
                .address(listing.getAddress())
                .ward(listing.getWard())
                .district(listing.getDistrict())
                .city(listing.getCity())
                .latitude(listing.getLatitude())
                .longitude(listing.getLongitude())
                .pricePerMonth(listing.getPricePerMonth())
                .areaM2(listing.getAreaM2())
                .numBedrooms(listing.getNumBedrooms())
                .numBathrooms(listing.getNumBathrooms())
                .hasWifi(listing.getHasWifi())
                .hasParking(listing.getHasParking())
                .hasAirConditioner(listing.getHasAirConditioner())
                .hasWashingMachine(listing.getHasWashingMachine())
                .allowPets(listing.getAllowPets())
                .status(listing.getStatus())
                .images(listing.getImages().stream()
                        .map(img -> ListingImageResponse.builder()
                                .id(img.getId())
                                .imageUrl(img.getImageUrl())
                                .displayOrder(img.getDisplayOrder())
                                .build())
                        .collect(Collectors.toList()))
                .createdAt(listing.getCreatedAt())
                .updatedAt(listing.getUpdatedAt())
                .build();
    }
}
