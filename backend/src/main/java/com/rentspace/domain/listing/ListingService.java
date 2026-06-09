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

import com.rentspace.domain.review.ReviewRepository;
import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ListingService {

    private final ListingRepository listingRepository;
    private final ListingImageRepository listingImageRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;
    private final ListingMapper listingMapper;
    private final ReviewRepository reviewRepository;

    // ===== GET /api/v1/listings =====
    public Page<ListingResponse> search(String city, String district,
                                        BigDecimal minPrice, BigDecimal maxPrice,
                                        BigDecimal minArea, Pageable pageable) {
        return listingRepository
                .search(ListingStatus.ACTIVE, city, district, minPrice, maxPrice, minArea, pageable)
                .map(listingMapper::toResponse)
                .map(this::enrichWithRating);
    }

    // ===== GET /api/v1/listings/nearby =====
    public List<ListingResponse> findNearby(double lat, double lng, double radiusKm, int limit) {
        return listingRepository.findNearby(lat, lng, radiusKm, limit)
                .stream()
                .map(listingMapper::toResponse)
                .map(this::enrichWithRating)
                .toList();
    }

    // ===== GET /api/v1/listings/my =====
    public Page<ListingResponse> getMyListings(String email, ListingStatus status, Pageable pageable) {
        if (status != null) {
            return listingRepository.findByLandlord_EmailAndStatus(email, status, pageable)
                    .map(listingMapper::toResponse)
                    .map(this::enrichWithRating);
        }
        return listingRepository.findByLandlord_EmailAndStatusNot(email, ListingStatus.DELETED, pageable)
                .map(listingMapper::toResponse)
                .map(this::enrichWithRating);
    }

    // ===== GET /api/v1/listings/{id} =====
    public ListingResponse getById(Long id, String requesterEmail) {
        Listing listing = listingRepository.findByIdAndStatusNot(id, ListingStatus.DELETED)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tin đăng với id: " + id));

        // Nếu tin đăng không ở trạng thái ACTIVE, chỉ cho phép chủ trọ đăng tin đó hoặc ADMIN xem
        if (listing.getStatus() != ListingStatus.ACTIVE) {
            if (requesterEmail == null) {
                throw new BusinessException("Tin đăng này hiện không công khai");
            }
            User user = userRepository.findByEmail(requesterEmail)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
            boolean isOwner = listing.getLandlord().getId().equals(user.getId());
            boolean isAdmin = user.getRole() == Role.ADMIN;
            if (!isOwner && !isAdmin) {
                throw new BusinessException("Tin đăng này hiện không công khai");
            }
        }

        return enrichWithRating(listingMapper.toResponse(listing));
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
                .status(ListingStatus.PENDING)
                .build();

        Listing saved = listingRepository.save(listing);
        log.info("Tạo tin đăng thành công: listingId={}, landlord={}", saved.getId(), email);
        return listingMapper.toResponse(saved);
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

        return listingMapper.toResponse(listingRepository.save(listing));
    }

    // ===== PATCH /api/v1/listings/{id}/status =====
    @Transactional
    public ListingResponse updateStatus(Long id, String email, ListingStatus newStatus) {
        Listing listing = findOwnedListing(id, email);

        if (newStatus == ListingStatus.DELETED) {
            throw new BusinessException("Dùng endpoint DELETE để xóa tin đăng");
        }

        listing.setStatus(newStatus);
        return listingMapper.toResponse(listingRepository.save(listing));
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
        return listingMapper.toImageResponse(saved);
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

    // ===== ADMIN: Lấy danh sách tin đăng =====
    public Page<ListingResponse> getAllListingsForAdmin(ListingStatus status, Pageable pageable) {
        if (status != null) {
            return listingRepository.findByStatus(status, pageable)
                    .map(listingMapper::toResponse);
        }
        return listingRepository.findByStatusNot(ListingStatus.DELETED, pageable)
                .map(listingMapper::toResponse);
    }

    // ===== ADMIN: Duyệt tin đăng =====
    @Transactional
    public ListingResponse approveListing(Long id) {
        Listing listing = listingRepository.findByIdAndStatusNot(id, ListingStatus.DELETED)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tin đăng: " + id));

        if (listing.getStatus() != ListingStatus.PENDING) {
            throw new BusinessException("Chỉ có thể duyệt tin đăng ở trạng thái PENDING. Hiện tại: " + listing.getStatus());
        }

        listing.setStatus(ListingStatus.ACTIVE);
        Listing saved = listingRepository.save(listing);
        log.info("Admin đã duyệt tin đăng id={}, tiêu đề: {}", id, listing.getTitle());
        return listingMapper.toResponse(saved);
    }

    // ===== ADMIN: Từ chối tin đăng =====
    @Transactional
    public ListingResponse rejectListing(Long id, String reason) {
        Listing listing = listingRepository.findByIdAndStatusNot(id, ListingStatus.DELETED)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tin đăng: " + id));

        if (listing.getStatus() != ListingStatus.PENDING) {
            throw new BusinessException("Chỉ có thể từ chối tin đăng ở trạng thái PENDING. Hiện tại: " + listing.getStatus());
        }

        listing.setStatus(ListingStatus.REJECTED);
        Listing saved = listingRepository.save(listing);
        log.info("Admin đã từ chối tin đăng id={}, tiêu đề: {}, lý do: {}", id, listing.getTitle(), reason);
        return listingMapper.toResponse(saved);
    }

    // ===== ADMIN: Cập nhật trạng thái tin đăng (gọi từ frontend Dashboard) =====
    @Transactional
    public ListingResponse updateStatusForAdmin(Long id, ListingStatus status) {
        Listing listing = listingRepository.findByIdAndStatusNot(id, ListingStatus.DELETED)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tin đăng: " + id));
        listing.setStatus(status);
        Listing saved = listingRepository.save(listing);
        log.info("Admin đã cập nhật trạng thái tin đăng id={} sang {}", id, status);
        return listingMapper.toResponse(saved);
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

    private ListingResponse enrichWithRating(ListingResponse response) {
        if (response == null) return null;
        Double avg = reviewRepository.getAverageRatingForListing(response.getId());
        Long count = reviewRepository.getReviewCountForListing(response.getId());
        response.setAverageRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0);
        response.setReviewCount(count != null ? count.intValue() : 0);
        return response;
    }
}
