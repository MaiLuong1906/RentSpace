package com.rentspace.domain.listing;

import com.rentspace.common.exception.BusinessException;
import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.domain.listing.dto.*;
import com.rentspace.domain.listing.enums.ListingStatus;
import com.rentspace.domain.listing.enums.RoomType;
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
import com.rentspace.domain.subscription.annotation.EnforceSubscriptionLimit;
import com.rentspace.domain.subscription.UserSubscriptionRepository;
import com.rentspace.domain.subscription.SubscriptionService;
import com.rentspace.domain.subscription.UserSubscription;
import com.rentspace.domain.subscription.enums.SubscriptionStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

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
    private final ListingViewRepository listingViewRepository;
    private final PromotedListingRepository promotedListingRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final SubscriptionService subscriptionService;

    // ===== GET /api/v1/listings =====
    public Page<ListingResponse> search(String city, String district,
                                        BigDecimal minPrice, BigDecimal maxPrice,
                                        BigDecimal minArea, Pageable pageable) {
        Page<ListingResponse> page = listingRepository
                .search(ListingStatus.ACTIVE, city, district, minPrice, maxPrice, minArea, pageable)
                .map(listingMapper::toResponse);
        return enrichPageWithRatingAndPromotion(page);
    }

    // ===== GET /api/v1/listings/nearby =====
    public List<ListingResponse> findNearby(double lat, double lng, double radiusKm, int limit) {
        List<ListingResponse> list = listingRepository.findNearby(lat, lng, radiusKm, limit)
                .stream()
                .map(listingMapper::toResponse)
                .toList();
        return enrichListWithRatingAndPromotion(new java.util.ArrayList<>(list));
    }

    // ===== GET /api/v1/listings/my =====
    public Page<ListingResponse> getMyListings(String email, ListingStatus status, Pageable pageable) {
        Page<ListingResponse> page;
        if (status != null) {
            page = listingRepository.findByLandlord_EmailAndStatus(email, status, pageable)
                    .map(listingMapper::toResponse);
        } else {
            page = listingRepository.findByLandlord_EmailAndStatusNot(email, ListingStatus.DELETED, pageable)
                    .map(listingMapper::toResponse);
        }
        return enrichPageWithRatingAndPromotion(page);
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
    @EnforceSubscriptionLimit
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
                .roomType(request.getRoomType() != null ? request.getRoomType() : RoomType.PHONG_TRO)
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
        if (request.getRoomType() != null && !request.getRoomType().equals(listing.getRoomType())) {
            RoomType oldRoomType = listing.getRoomType();
            listing.setRoomType(request.getRoomType());
            // Thay đổi loại phòng cần admin duyệt lại để đảm bảo tính chính xác
            if (listing.getStatus() == ListingStatus.ACTIVE) {
                listing.setStatus(ListingStatus.PENDING);
                log.info("Listing id={} reset về PENDING do thay đổi loại phòng: {} -> {}", listing.getId(), oldRoomType, request.getRoomType());
            }
        }

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

        User landlord = listing.getLandlord();
        UserSubscription activeSub = userSubscriptionRepository
                .findFirstByUserIdAndStatusOrderByStartedAtDesc(landlord.getId(), SubscriptionStatus.ACTIVE)
                .orElseGet(() -> subscriptionService.getOrCreateDefaultFreeSubscription(landlord));

        int maxImages = activeSub.getPlan().getMaxImages();

        if (listing.getImages().size() >= maxImages) {
            throw new BusinessException(String.format("Tin đăng chỉ được tải lên tối đa %d ảnh (Theo gói %s)", 
                    maxImages, activeSub.getPlan().getDisplayName()));
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

    @Transactional
    public void recordView(Long listingId, String userEmail) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tin đăng: " + listingId));

        User viewer = null;
        if (userEmail != null) {
            viewer = userRepository.findByEmail(userEmail).orElse(null);
        }

        if (viewer != null) {
            LocalDateTime limitTime = LocalDateTime.now().minusDays(1);
            boolean alreadyViewed = listingViewRepository.existsByListingIdAndViewerIdAndViewedAtAfter(
                    listingId, viewer.getId(), limitTime);
            if (alreadyViewed) {
                log.debug("User {} đã xem tin đăng {} trong vòng 24 giờ. Bỏ qua ghi nhận.", userEmail, listingId);
                return;
            }
        }

        ListingView listingView = ListingView.builder()
                .listing(listing)
                .viewer(viewer)
                .build();

        listingViewRepository.save(listingView);
        log.info("Đã ghi nhận lượt xem cho tin đăng id={} (người xem: {})", listingId, userEmail != null ? userEmail : "Ẩn danh");
    }

    private ListingResponse enrichWithRating(ListingResponse response) {
        if (response == null) return null;
        Double avg = reviewRepository.getAverageRatingForListing(response.getId());
        Long count = reviewRepository.getReviewCountForListing(response.getId());
        response.setAverageRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0);
        response.setReviewCount(count != null ? count.intValue() : 0);

        // Enrich with promotion status
        List<PromotedListing> activePromotions = promotedListingRepository.findByListingIdAndIsActiveTrue(response.getId());
        Optional<PromotedListing> currentActive = activePromotions.stream()
                .filter(p -> p.getExpiresAt() != null && p.getExpiresAt().isAfter(LocalDateTime.now()))
                .findFirst();
        if (currentActive.isPresent()) {
            response.setIsPromoted(true);
            response.setPromotedExpiresAt(currentActive.get().getExpiresAt());
        } else {
            response.setIsPromoted(false);
        }

        return response;
    }

    private Page<ListingResponse> enrichPageWithRatingAndPromotion(Page<ListingResponse> page) {
        if (page == null || page.isEmpty()) return page;
        enrichListWithRatingAndPromotion(page.getContent());
        return page;
    }

    private List<ListingResponse> enrichListWithRatingAndPromotion(List<ListingResponse> list) {
        if (list == null || list.isEmpty()) return list;

        List<Long> listingIds = list.stream().map(ListingResponse::getId).toList();

        // 1. Batch fetch average rating & count
        List<Object[]> ratingData = reviewRepository.getAverageRatingAndCountForListingIds(listingIds);
        java.util.Map<Long, Double> avgRatingMap = new java.util.HashMap<>();
        java.util.Map<Long, Integer> countMap = new java.util.HashMap<>();
        for (Object[] row : ratingData) {
            Long listingId = (Long) row[0];
            Double avg = (Double) row[1];
            Long count = (Long) row[2];
            avgRatingMap.put(listingId, avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0);
            countMap.put(listingId, count != null ? count.intValue() : 0);
        }

        // 2. Batch fetch active promotions
        List<PromotedListing> activePromotions = promotedListingRepository.findActiveByListingIds(listingIds, LocalDateTime.now());
        java.util.Map<Long, PromotedListing> promotionMap = new java.util.HashMap<>();
        for (PromotedListing p : activePromotions) {
            PromotedListing existing = promotionMap.get(p.getListing().getId());
            if (existing == null || p.getExpiresAt().isAfter(existing.getExpiresAt())) {
                promotionMap.put(p.getListing().getId(), p);
            }
        }

        // 3. Map to responses
        for (ListingResponse response : list) {
            Long id = response.getId();
            response.setAverageRating(avgRatingMap.getOrDefault(id, 0.0));
            response.setReviewCount(countMap.getOrDefault(id, 0));

            PromotedListing promo = promotionMap.get(id);
            if (promo != null) {
                response.setIsPromoted(true);
                response.setPromotedExpiresAt(promo.getExpiresAt());
            } else {
                response.setIsPromoted(false);
            }
        }

        return list;
    }
}
