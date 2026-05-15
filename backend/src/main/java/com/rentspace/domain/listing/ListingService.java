package com.rentspace.domain.listing;

import com.rentspace.common.exception.BusinessException;
import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.domain.listing.dto.*;
import com.rentspace.domain.listing.enums.ListingStatus;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import com.rentspace.domain.user.enums.KycStatus;
import com.rentspace.domain.user.enums.Role;
import com.rentspace.infrastructure.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ListingService {

    private final ListingRepository listingRepository;
    private final ListingImageRepository listingImageRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;

    // ===== GET /api/v1/listings =====
    public Page<ListingResponse> search(String city, String district,
                                        BigDecimal minPrice, BigDecimal maxPrice,
                                        BigDecimal minArea, Pageable pageable) {
        return listingRepository
                .search(ListingStatus.ACTIVE, city, district, minPrice, maxPrice, minArea, pageable)
                .map(this::mapToResponse);
    }

    // ===== GET /api/v1/listings/nearby =====
    public List<ListingResponse> findNearby(double lat, double lng, double radiusKm, int limit) {
        return listingRepository.findNearby(lat, lng, radiusKm, limit)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ===== GET /api/v1/listings/{id} =====
    public ListingResponse getById(Long id) {
        Listing listing = listingRepository.findByIdAndStatusNot(id, ListingStatus.DELETED)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tin đăng với id: " + id));
        return mapToResponse(listing);
    }

    // ===== POST /api/v1/listings =====
    @Transactional
    public ListingResponse create(String email, CreateListingRequest request) {
        User landlord = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        // Kiểm tra role trước
        if (landlord.getRole() != Role.LANDLORD) {
            throw new BusinessException("Chỉ tài khoản Chủ trọ (LANDLORD) mới được đăng tin. Vui lòng liên hệ hỗ trợ để nâng cấp tài khoản.");
        }

        // Kiểm tra KYC sau
        if (landlord.getKycStatus() != KycStatus.VERIFIED) {
            throw new BusinessException("Bạn cần hoàn thành xác thực danh tính (KYC) trước khi đăng tin");
        }

        Listing listing = Listing.builder()
                .landlord(landlord)
                .title(request.getTitle())
                .description(request.getDescription())
                .address(request.getAddress())
                .ward(request.getWard())
                .district(request.getDistrict())
                .city(request.getCity())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .pricePerMonth(request.getPricePerMonth())
                .areaM2(request.getAreaM2())
                .numBedrooms(request.getNumBedrooms())
                .numBathrooms(request.getNumBathrooms())
                .hasWifi(Boolean.TRUE.equals(request.getHasWifi()))
                .hasParking(Boolean.TRUE.equals(request.getHasParking()))
                .hasAirConditioner(Boolean.TRUE.equals(request.getHasAirConditioner()))
                .hasWashingMachine(Boolean.TRUE.equals(request.getHasWashingMachine()))
                .allowPets(Boolean.TRUE.equals(request.getAllowPets()))
                .status(ListingStatus.ACTIVE)
                .build();

        Listing saved = listingRepository.save(listing);
        log.info("Tạo tin đăng thành công: listingId={}, landlord={}", saved.getId(), email);
        return mapToResponse(saved);
    }

    // ===== PUT /api/v1/listings/{id} =====
    @Transactional
    public ListingResponse update(Long id, String email, CreateListingRequest request) {
        Listing listing = findOwnedListing(id, email);

        listing.setTitle(request.getTitle());
        listing.setDescription(request.getDescription());
        listing.setAddress(request.getAddress());
        listing.setWard(request.getWard());
        listing.setDistrict(request.getDistrict());
        listing.setCity(request.getCity());
        listing.setLatitude(request.getLatitude());
        listing.setLongitude(request.getLongitude());
        listing.setPricePerMonth(request.getPricePerMonth());
        listing.setAreaM2(request.getAreaM2());
        listing.setNumBedrooms(request.getNumBedrooms());
        listing.setNumBathrooms(request.getNumBathrooms());
        listing.setHasWifi(Boolean.TRUE.equals(request.getHasWifi()));
        listing.setHasParking(Boolean.TRUE.equals(request.getHasParking()));
        listing.setHasAirConditioner(Boolean.TRUE.equals(request.getHasAirConditioner()));
        listing.setHasWashingMachine(Boolean.TRUE.equals(request.getHasWashingMachine()));
        listing.setAllowPets(Boolean.TRUE.equals(request.getAllowPets()));

        return mapToResponse(listingRepository.save(listing));
    }

    // ===== PATCH /api/v1/listings/{id}/status =====
    @Transactional
    public ListingResponse updateStatus(Long id, String email, ListingStatus newStatus) {
        Listing listing = findOwnedListing(id, email);

        if (newStatus == ListingStatus.DELETED) {
            throw new BusinessException("Dùng endpoint DELETE để xóa tin đăng");
        }

        listing.setStatus(newStatus);
        return mapToResponse(listingRepository.save(listing));
    }

    // ===== DELETE /api/v1/listings/{id} (Soft Delete) =====
    @Transactional
    public void delete(Long id, String email, boolean isAdmin) {
        Listing listing = listingRepository.findByIdAndStatusNot(id, ListingStatus.DELETED)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tin đăng: " + id));

        // Nếu không phải Admin thì phải là chủ sở hữu
        if (!isAdmin && !listing.getLandlord().getEmail().equals(email)) {
            throw new BusinessException("Bạn không có quyền xóa tin đăng này");
        }

        listing.setStatus(ListingStatus.DELETED);
        listingRepository.save(listing);
        log.info("Soft delete tin đăng id={} bởi {}", id, email);
    }

    // ===== POST /api/v1/listings/{id}/images =====
    @Transactional
    public ListingImageResponse addImage(Long id, String email, MultipartFile file) {
        Listing listing = findOwnedListing(id, email);

        if (listing.getImages().size() >= 10) {
            throw new BusinessException("Tin đăng chỉ được tối đa 10 ảnh");
        }

        String imageUrl = storageService.uploadFile(file, "listings/" + id);

        ListingImage image = ListingImage.builder()
                .listing(listing)
                .imageUrl(imageUrl)
                .displayOrder(listing.getImages().size())
                .build();

        ListingImage saved = listingImageRepository.save(image);
        log.info("Upload ảnh thành công cho listing id={}", id);
        return mapToImageResponse(saved);
    }

    // ===== DELETE /api/v1/listings/{id}/images/{imageId} =====
    @Transactional
    public void deleteImage(Long id, Long imageId, String email) {
        findOwnedListing(id, email); // Kiểm tra quyền sở hữu

        ListingImage image = listingImageRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ảnh: " + imageId));

        if (!image.getListing().getId().equals(id)) {
            throw new BusinessException("Ảnh này không thuộc tin đăng " + id);
        }

        try {
            storageService.deleteFile(image.getImageUrl());
        } catch (Exception e) {
            log.warn("Không thể xóa ảnh: {}", e.getMessage());
        }

        listingImageRepository.delete(image);
    }

    // ===== Private Helpers =====
    private Listing findOwnedListing(Long id, String email) {
        Listing listing = listingRepository.findByIdAndStatusNot(id, ListingStatus.DELETED)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tin đăng: " + id));
        if (!listing.getLandlord().getEmail().equals(email)) {
            throw new BusinessException("Bạn không có quyền chỉnh sửa tin đăng này");
        }
        return listing;
    }

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
                .images(listing.getImages().stream().map(this::mapToImageResponse).collect(Collectors.toList()))
                .createdAt(listing.getCreatedAt())
                .updatedAt(listing.getUpdatedAt())
                .build();
    }

    private ListingImageResponse mapToImageResponse(ListingImage image) {
        return ListingImageResponse.builder()
                .id(image.getId())
                .imageUrl(image.getImageUrl())
                .displayOrder(image.getDisplayOrder())
                .build();
    }
}
