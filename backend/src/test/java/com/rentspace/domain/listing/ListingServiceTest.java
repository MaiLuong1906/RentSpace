package com.rentspace.domain.listing;

import com.rentspace.common.exception.BusinessException;
import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.domain.listing.dto.*;
import com.rentspace.domain.listing.enums.ListingStatus;
import com.rentspace.domain.review.ReviewRepository;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import com.rentspace.domain.user.enums.KycStatus;
import com.rentspace.domain.user.enums.Role;
import com.rentspace.infrastructure.storage.StorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import com.rentspace.domain.subscription.UserSubscriptionRepository;
import com.rentspace.domain.subscription.SubscriptionService;
import com.rentspace.domain.subscription.UserSubscription;
import com.rentspace.domain.subscription.SubscriptionPlan;
import com.rentspace.domain.subscription.enums.SubscriptionStatus;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests cho ListingService — module quản lý tin đăng bất động sản.
 * Đảm bảo các luồng tìm kiếm, CRUD, phân quyền vai trò (Role), điều kiện KYC và kiểm duyệt của Admin hoạt động chính xác.
 */
@ExtendWith(MockitoExtension.class)
class ListingServiceTest {

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private ListingImageRepository listingImageRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private StorageService storageService;

    @Mock
    private ListingMapper listingMapper;

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private ListingViewRepository listingViewRepository;

    @Mock
    private PromotedListingRepository promotedListingRepository;

    @Mock
    private UserSubscriptionRepository userSubscriptionRepository;

    @Mock
    private SubscriptionService subscriptionService;

    @InjectMocks
    private ListingService listingService;

    private User landlord;
    private User tenant;
    private User admin;
    private Listing listing;
    private ListingResponse listingResponse;

    @BeforeEach
    void setUp() {
        landlord = User.builder()
                .id(1L)
                .email("landlord@rentspace.com")
                .fullName("Nguyen Van Landlord")
                .role(Role.LANDLORD)
                .kycStatus(KycStatus.VERIFIED)
                .isActive(true)
                .build();

        tenant = User.builder()
                .id(2L)
                .email("tenant@rentspace.com")
                .fullName("Nguyen Van Tenant")
                .role(Role.TENANT)
                .kycStatus(KycStatus.VERIFIED)
                .isActive(true)
                .build();

        admin = User.builder()
                .id(99L)
                .email("admin@rentspace.com")
                .fullName("System Admin")
                .role(Role.ADMIN)
                .isActive(true)
                .build();

        listing = Listing.builder()
                .id(10L)
                .landlord(landlord)
                .title("Căn hộ dịch vụ cao cấp Quận 1")
                .description("Phòng đẹp đầy đủ tiện nghi")
                .address("123 Nguyễn Huệ")
                .city("Hồ Chí Minh")
                .district("Quận 1")
                .pricePerMonth(BigDecimal.valueOf(5000000))
                .areaM2(BigDecimal.valueOf(30.0))
                .status(ListingStatus.ACTIVE)
                .images(new ArrayList<>())
                .build();

        listingResponse = ListingResponse.builder()
                .id(10L)
                .title("Căn hộ dịch vụ cao cấp Quận 1")
                .address("123 Nguyễn Huệ")
                .city("Hồ Chí Minh")
                .district("Quận 1")
                .pricePerMonth(BigDecimal.valueOf(5000000))
                .areaM2(BigDecimal.valueOf(30.0))
                .status(ListingStatus.ACTIVE)
                .build();

        lenient().when(promotedListingRepository.findByListingIdAndIsActiveTrue(anyLong()))
                .thenReturn(Collections.emptyList());
        lenient().when(promotedListingRepository.findActiveByListingIds(anyList(), any()))
                .thenReturn(Collections.emptyList());
    }

    // =========================================================================
    // SEARCH & FIND NEARBY
    // =========================================================================
    @Nested
    @DisplayName("Tìm kiếm tin đăng")
    class SearchTests {

        @Test
        @DisplayName("Search thành công — trả về kết quả được map và làm giàu rating")
        void search_withValidParams_shouldReturnEnrichedPage() {
            // Given
            Pageable pageable = PageRequest.of(0, 10);
            Page<Listing> listingPage = new PageImpl<>(Collections.singletonList(listing), pageable, 1);

            when(listingRepository.search(eq(ListingStatus.ACTIVE), anyString(), anyString(), any(), any(), any(), any()))
                    .thenReturn(listingPage);
            when(listingMapper.toResponse(any(Listing.class))).thenReturn(listingResponse);
            when(reviewRepository.getAverageRatingAndCountForListingIds(anyList()))
                    .thenReturn(Collections.singletonList(new Object[]{10L, 4.5, 12L}));
            when(promotedListingRepository.findActiveByListingIds(anyList(), any()))
                    .thenReturn(Collections.emptyList());

            // When
            Page<ListingResponse> result = listingService.search("Hồ Chí Minh", "Quận 1", BigDecimal.ZERO, BigDecimal.valueOf(10000000), BigDecimal.ZERO, pageable);

            // Then
            assertNotNull(result);
            assertEquals(1, result.getTotalElements());
            ListingResponse res = result.getContent().get(0);
            assertEquals(10L, res.getId());
            assertEquals(4.5, res.getAverageRating());
            assertEquals(12, res.getReviewCount());
        }

        @Test
        @DisplayName("Tìm phòng lân cận (findNearby) — trả về danh sách được làm giàu rating")
        void findNearby_withGeoParams_shouldReturnEnrichedList() {
            // Given
            when(listingRepository.findNearby(10.1, 106.2, 5.0, 5)).thenReturn(Collections.singletonList(listing));
            when(listingMapper.toResponse(any(Listing.class))).thenReturn(listingResponse);
            when(reviewRepository.getAverageRatingAndCountForListingIds(anyList()))
                    .thenReturn(Collections.singletonList(new Object[]{10L, 5.0, 1L}));
            when(promotedListingRepository.findActiveByListingIds(anyList(), any()))
                    .thenReturn(Collections.emptyList());

            // When
            List<ListingResponse> result = listingService.findNearby(10.1, 106.2, 5.0, 5);

            // Then
            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals(5.0, result.get(0).getAverageRating());
            assertEquals(1, result.get(0).getReviewCount());
        }
    }

    // =========================================================================
    // GET BY ID
    // =========================================================================
    @Nested
    @DisplayName("Xem chi tiết tin đăng (getById)")
    class GetByIdTests {

        @Test
        @DisplayName("Tin đăng ACTIVE — xem thành công không cần đăng nhập")
        void getById_whenActive_shouldReturnEnrichedResponse() {
            // Given
            when(listingRepository.findByIdAndStatusNot(10L, ListingStatus.DELETED)).thenReturn(Optional.of(listing));
            when(listingMapper.toResponse(listing)).thenReturn(listingResponse);
            when(reviewRepository.getAverageRatingForListing(10L)).thenReturn(4.8);
            when(reviewRepository.getReviewCountForListing(10L)).thenReturn(5L);

            // When
            ListingResponse response = listingService.getById(10L, null);

            // Then
            assertNotNull(response);
            assertEquals(4.8, response.getAverageRating());
            assertEquals(5, response.getReviewCount());
        }

        @Test
        @DisplayName("Tin đăng PENDING — chủ trọ của tin đăng được phép xem")
        void getById_whenPendingAndRequesterIsOwner_shouldAllowViewing() {
            // Given
            listing.setStatus(ListingStatus.PENDING);
            listingResponse.setStatus(ListingStatus.PENDING);
            when(listingRepository.findByIdAndStatusNot(10L, ListingStatus.DELETED)).thenReturn(Optional.of(listing));
            when(userRepository.findByEmail("landlord@rentspace.com")).thenReturn(Optional.of(landlord));
            when(listingMapper.toResponse(listing)).thenReturn(listingResponse);

            // When
            ListingResponse response = listingService.getById(10L, "landlord@rentspace.com");

            // Then
            assertNotNull(response);
            assertEquals(ListingStatus.PENDING, response.getStatus());
        }

        @Test
        @DisplayName("Tin đăng PENDING — Admin được phép xem")
        void getById_whenPendingAndRequesterIsAdmin_shouldAllowViewing() {
            // Given
            listing.setStatus(ListingStatus.PENDING);
            listingResponse.setStatus(ListingStatus.PENDING);
            when(listingRepository.findByIdAndStatusNot(10L, ListingStatus.DELETED)).thenReturn(Optional.of(listing));
            when(userRepository.findByEmail("admin@rentspace.com")).thenReturn(Optional.of(admin));
            when(listingMapper.toResponse(listing)).thenReturn(listingResponse);

            // When
            ListingResponse response = listingService.getById(10L, "admin@rentspace.com");

            // Then
            assertNotNull(response);
            assertEquals(ListingStatus.PENDING, response.getStatus());
        }

        @Test
        @DisplayName("Tin đăng PENDING — người dùng khác xem sẽ bị từ chối với BusinessException")
        void getById_whenPendingAndRequesterIsStranger_shouldThrowBusinessException() {
            // Given
            listing.setStatus(ListingStatus.PENDING);
            when(listingRepository.findByIdAndStatusNot(10L, ListingStatus.DELETED)).thenReturn(Optional.of(listing));
            when(userRepository.findByEmail("tenant@rentspace.com")).thenReturn(Optional.of(tenant));

            // When & Then
            BusinessException exception = assertThrows(BusinessException.class,
                    () -> listingService.getById(10L, "tenant@rentspace.com"));

            assertTrue(exception.getMessage().contains("không công khai"));
        }
    }

    // =========================================================================
    // CREATE LISTING
    // =========================================================================
    @Nested
    @DisplayName("Tạo tin đăng (create)")
    class CreateListingTests {

        private CreateListingRequest createValidRequest() {
            CreateListingRequest req = new CreateListingRequest();
            req.setTitle("Phòng trọ giá rẻ");
            req.setDescription("Mô tả phòng trọ");
            req.setAddress("456 CMT8");
            req.setCity("Hồ Chí Minh");
            req.setDistrict("Quận 3");
            req.setPricePerMonth(BigDecimal.valueOf(3000000));
            req.setAreaM2(BigDecimal.valueOf(20.0));
            return req;
        }

        @Test
        @DisplayName("Tạo tin đăng thành công — mặc định trạng thái PENDING chờ duyệt")
        void create_withValidDataAndVerifiedLandlord_shouldSaveAsPending() {
            // Given
            CreateListingRequest request = createValidRequest();
            when(userRepository.findByEmail("landlord@rentspace.com")).thenReturn(Optional.of(landlord));
            when(listingRepository.save(any(Listing.class))).thenAnswer(invocation -> {
                Listing saved = invocation.getArgument(0);
                saved.setId(11L);
                return saved;
            });
            when(listingMapper.toResponse(any(Listing.class))).thenAnswer(invocation -> {
                Listing l = invocation.getArgument(0);
                return ListingResponse.builder().id(l.getId()).status(l.getStatus()).title(l.getTitle()).build();
            });

            // When
            ListingResponse response = listingService.create("landlord@rentspace.com", request);

            // Then
            assertNotNull(response);
            assertEquals(11L, response.getId());
            assertEquals(ListingStatus.PENDING, response.getStatus());

            ArgumentCaptor<Listing> listingCaptor = ArgumentCaptor.forClass(Listing.class);
            verify(listingRepository).save(listingCaptor.capture());
            Listing savedListing = listingCaptor.getValue();
            assertEquals("Phòng trọ giá rẻ", savedListing.getTitle());
            assertEquals(1L, savedListing.getLandlord().getId());
        }

        @Test
        @DisplayName("Người dùng không phải Landlord tạo tin đăng — ném BusinessException")
        void create_whenUserIsNotLandlord_shouldThrowException() {
            // Given
            CreateListingRequest request = createValidRequest();
            when(userRepository.findByEmail("tenant@rentspace.com")).thenReturn(Optional.of(tenant));

            // When & Then
            BusinessException exception = assertThrows(BusinessException.class,
                    () -> listingService.create("tenant@rentspace.com", request));

            assertTrue(exception.getMessage().contains("Chỉ tài khoản Chủ trọ"));
            verify(listingRepository, never()).save(any());
        }

        @Test
        @DisplayName("Landlord chưa xác minh danh tính (KYC) tạo tin đăng — ném BusinessException")
        void create_whenLandlordNotVerifiedKYC_shouldThrowException() {
            // Given
            CreateListingRequest request = createValidRequest();
            landlord.setKycStatus(KycStatus.REJECTED);
            when(userRepository.findByEmail("landlord@rentspace.com")).thenReturn(Optional.of(landlord));

            // When & Then
            BusinessException exception = assertThrows(BusinessException.class,
                    () -> listingService.create("landlord@rentspace.com", request));

            assertTrue(exception.getMessage().contains("xác thực danh tính (KYC)"));
            verify(listingRepository, never()).save(any());
        }
    }

    // =========================================================================
    // UPDATE LISTING
    // =========================================================================
    @Nested
    @DisplayName("Cập nhật tin đăng (update)")
    class UpdateListingTests {

        private CreateListingRequest createUpdateRequest() {
            CreateListingRequest req = new CreateListingRequest();
            req.setTitle("Tiêu đề cập nhật");
            req.setPricePerMonth(BigDecimal.valueOf(6000000));
            req.setAreaM2(BigDecimal.valueOf(35.0));
            return req;
        }

        @Test
        @DisplayName("Chủ sở hữu cập nhật thành công")
        void update_byOwner_shouldSaveAndReturnResponse() {
            // Given
            CreateListingRequest request = createUpdateRequest();
            when(listingRepository.findByIdAndStatusNot(10L, ListingStatus.DELETED)).thenReturn(Optional.of(listing));
            when(listingRepository.save(any(Listing.class))).thenReturn(listing);
            when(listingMapper.toResponse(any(Listing.class))).thenReturn(listingResponse);

            // When
            ListingResponse response = listingService.update(10L, "landlord@rentspace.com", request);

            // Then
            assertNotNull(response);
            assertEquals("Tiêu đề cập nhật", listing.getTitle());
            assertEquals(BigDecimal.valueOf(6000000), listing.getPricePerMonth());
        }

        @Test
        @DisplayName("Người khác cố tình cập nhật — ném BusinessException")
        void update_byOtherUser_shouldThrowException() {
            // Given
            CreateListingRequest request = createUpdateRequest();
            when(listingRepository.findByIdAndStatusNot(10L, ListingStatus.DELETED)).thenReturn(Optional.of(listing));

            // When & Then
            BusinessException exception = assertThrows(BusinessException.class,
                    () -> listingService.update(10L, "other@rentspace.com", request));

            assertTrue(exception.getMessage().contains("không có quyền chỉnh sửa"));
            verify(listingRepository, never()).save(listing);
        }
    }

    // =========================================================================
    // DELETE LISTING
    // =========================================================================
    @Nested
    @DisplayName("Xóa tin đăng (soft delete)")
    class DeleteListingTests {

        @Test
        @DisplayName("Chủ sở hữu thực hiện xóa tin đăng — chuyển trạng thái thành DELETED")
        void delete_byOwner_shouldSetStatusToDeleted() {
            // Given
            when(listingRepository.findByIdAndStatusNot(10L, ListingStatus.DELETED)).thenReturn(Optional.of(listing));

            // When
            listingService.delete(10L, "landlord@rentspace.com", false);

            // Then
            assertEquals(ListingStatus.DELETED, listing.getStatus());
            verify(listingRepository).save(listing);
        }

        @Test
        @DisplayName("Admin thực hiện xóa tin đăng — chuyển trạng thái thành DELETED")
        void delete_byAdmin_shouldSetStatusToDeleted() {
            // Given
            when(listingRepository.findByIdAndStatusNot(10L, ListingStatus.DELETED)).thenReturn(Optional.of(listing));

            // When
            listingService.delete(10L, "admin@rentspace.com", true);

            // Then
            assertEquals(ListingStatus.DELETED, listing.getStatus());
            verify(listingRepository).save(listing);
        }

        @Test
        @DisplayName("Người khác xóa tin đăng — ném BusinessException")
        void delete_byStranger_shouldThrowException() {
            // Given
            when(listingRepository.findByIdAndStatusNot(10L, ListingStatus.DELETED)).thenReturn(Optional.of(listing));

            // When & Then
            BusinessException exception = assertThrows(BusinessException.class,
                    () -> listingService.delete(10L, "stranger@rentspace.com", false));

            assertTrue(exception.getMessage().contains("không có quyền xóa"));
            verify(listingRepository, never()).save(listing);
        }
    }

    // =========================================================================
    // IMAGES MANAGEMENT
    // =========================================================================
    @Nested
    @DisplayName("Quản lý hình ảnh tin đăng")
    class ImagesManagementTests {

        @Mock
        private MultipartFile multipartFile;

        @Test
        @DisplayName("Thêm ảnh thành công khi số ảnh dưới 10")
        void addImage_whenCountLessThanTen_shouldUploadAndSave() {
            // Given
            SubscriptionPlan plan = SubscriptionPlan.builder().id(1).name(com.rentspace.domain.subscription.enums.PlanName.FREE).displayName("Miễn phí").maxImages(10).build();
            UserSubscription sub = UserSubscription.builder().id(1L).user(landlord).plan(plan).status(SubscriptionStatus.ACTIVE).build();
            when(listingRepository.findByIdAndStatusNot(10L, ListingStatus.DELETED)).thenReturn(Optional.of(listing));
            when(userSubscriptionRepository.findFirstByUserIdAndStatusOrderByStartedAtDesc(landlord.getId(), SubscriptionStatus.ACTIVE))
                    .thenReturn(Optional.of(sub));
            when(storageService.uploadFile(any(), anyString())).thenReturn("https://s3.com/image.jpg");
            when(listingImageRepository.save(any(ListingImage.class))).thenAnswer(i -> i.getArgument(0));
            when(listingMapper.toImageResponse(any(ListingImage.class))).thenReturn(
                    ListingImageResponse.builder().id(1L).imageUrl("https://s3.com/image.jpg").displayOrder(0).build()
            );

            // When
            ListingImageResponse response = listingService.addImage(10L, "landlord@rentspace.com", multipartFile);

            // Then
            assertNotNull(response);
            assertEquals("https://s3.com/image.jpg", response.getImageUrl());
            verify(storageService).uploadFile(multipartFile, "listings/10");
        }

        @Test
        @DisplayName("Thêm ảnh thất bại khi số ảnh đã đạt 10")
        void addImage_whenCountIsTen_shouldThrowException() {
            // Given
            SubscriptionPlan plan = SubscriptionPlan.builder().id(1).name(com.rentspace.domain.subscription.enums.PlanName.FREE).displayName("Miễn phí").maxImages(10).build();
            UserSubscription sub = UserSubscription.builder().id(1L).user(landlord).plan(plan).status(SubscriptionStatus.ACTIVE).build();
            for (int i = 0; i < 10; i++) {
                listing.getImages().add(new ListingImage());
            }
            when(listingRepository.findByIdAndStatusNot(10L, ListingStatus.DELETED)).thenReturn(Optional.of(listing));
            when(userSubscriptionRepository.findFirstByUserIdAndStatusOrderByStartedAtDesc(landlord.getId(), SubscriptionStatus.ACTIVE))
                    .thenReturn(Optional.of(sub));

            // When & Then
            BusinessException exception = assertThrows(BusinessException.class,
                    () -> listingService.addImage(10L, "landlord@rentspace.com", multipartFile));

            assertTrue(exception.getMessage().contains("tối đa 10 ảnh"));
            verify(storageService, never()).uploadFile(any(), anyString());
        }
    }

    // =========================================================================
    // ADMIN ACTIONS
    // =========================================================================
    @Nested
    @DisplayName("Kiểm duyệt của Admin")
    class AdminActionsTests {

        @Test
        @DisplayName("Admin duyệt tin đăng PENDING — chuyển sang ACTIVE")
        void approveListing_whenPending_shouldSetActive() {
            // Given
            listing.setStatus(ListingStatus.PENDING);
            when(listingRepository.findByIdAndStatusNot(10L, ListingStatus.DELETED)).thenReturn(Optional.of(listing));
            when(listingRepository.save(listing)).thenReturn(listing);
            when(listingMapper.toResponse(listing)).thenReturn(listingResponse);

            // When
            ListingResponse response = listingService.approveListing(10L);

            // Then
            assertNotNull(response);
            assertEquals(ListingStatus.ACTIVE, listing.getStatus());
            verify(listingRepository).save(listing);
        }

        @Test
        @DisplayName("Admin duyệt tin đăng không phải PENDING — ném BusinessException")
        void approveListing_whenNotPending_shouldThrowException() {
            // Given
            listing.setStatus(ListingStatus.ACTIVE);
            when(listingRepository.findByIdAndStatusNot(10L, ListingStatus.DELETED)).thenReturn(Optional.of(listing));

            // When & Then
            BusinessException exception = assertThrows(BusinessException.class,
                    () -> listingService.approveListing(10L));

            assertTrue(exception.getMessage().contains("Chỉ có thể duyệt tin đăng ở trạng thái PENDING"));
            verify(listingRepository, never()).save(listing);
        }

        @Test
        @DisplayName("Admin từ chối tin đăng PENDING — chuyển sang REJECTED")
        void rejectListing_whenPending_shouldSetRejected() {
            // Given
            listing.setStatus(ListingStatus.PENDING);
            when(listingRepository.findByIdAndStatusNot(10L, ListingStatus.DELETED)).thenReturn(Optional.of(listing));
            when(listingRepository.save(listing)).thenReturn(listing);
            when(listingMapper.toResponse(listing)).thenReturn(listingResponse);

            // When
            ListingResponse response = listingService.rejectListing(10L, "Thông tin sai lệch");

            // Then
            assertNotNull(response);
            assertEquals(ListingStatus.REJECTED, listing.getStatus());
            verify(listingRepository).save(listing);
        }
    }

    // =========================================================================
    // RECORD VIEW
    // =========================================================================
    @Nested
    @DisplayName("Ghi nhận lượt xem tin đăng (recordView)")
    class RecordViewTests {

        @Test
        @DisplayName("Người xem ẩn danh — ghi nhận thành công không cần kiểm tra trùng")
        void recordView_anonymous_shouldSaveSuccessfully() {
            // Given
            when(listingRepository.findById(10L)).thenReturn(Optional.of(listing));

            // When
            listingService.recordView(10L, null);

            // Then
            verify(listingViewRepository).save(any(ListingView.class));
        }

        @Test
        @DisplayName("Người xem đã đăng nhập và chưa xem trong 24h — ghi nhận thành công")
        void recordView_loggedIn_notViewedRecently_shouldSaveSuccessfully() {
            // Given
            when(listingRepository.findById(10L)).thenReturn(Optional.of(listing));
            when(userRepository.findByEmail("viewer@rentspace.com")).thenReturn(Optional.of(tenant));
            when(listingViewRepository.existsByListingIdAndViewerIdAndViewedAtAfter(eq(10L), eq(2L), any(LocalDateTime.class)))
                    .thenReturn(false);

            // When
            listingService.recordView(10L, "viewer@rentspace.com");

            // Then
            verify(listingViewRepository).save(any(ListingView.class));
        }

        @Test
        @DisplayName("Người xem đã đăng nhập và đã xem trong 24h — bỏ qua không lưu")
        void recordView_loggedIn_alreadyViewedRecently_shouldSkipSaving() {
            // Given
            when(listingRepository.findById(10L)).thenReturn(Optional.of(listing));
            when(userRepository.findByEmail("viewer@rentspace.com")).thenReturn(Optional.of(tenant));
            when(listingViewRepository.existsByListingIdAndViewerIdAndViewedAtAfter(eq(10L), eq(2L), any(LocalDateTime.class)))
                    .thenReturn(true);

            // When
            listingService.recordView(10L, "viewer@rentspace.com");

            // Then
            verify(listingViewRepository, never()).save(any(ListingView.class));
        }
    }
}
