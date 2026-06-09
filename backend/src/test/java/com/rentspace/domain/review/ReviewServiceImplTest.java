package com.rentspace.domain.review;

import com.rentspace.common.exception.BusinessException;
import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.domain.listing.Listing;
import com.rentspace.domain.listing.ListingRepository;
import com.rentspace.domain.review.dto.ReviewRequest;
import com.rentspace.domain.review.dto.ReviewResponse;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import com.rentspace.domain.user.enums.Role;
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

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests cho ReviewServiceImpl.
 * Kiểm tra các ràng buộc bảo mật và tính đúng đắn của nghiệp vụ đánh giá phòng trọ.
 */
@ExtendWith(MockitoExtension.class)
class ReviewServiceImplTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ReviewMapper reviewMapper;

    @InjectMocks
    private ReviewServiceImpl reviewService;

    private User tenant;
    private User landlord;
    private User admin;
    private Listing listing;
    private Review review;

    @BeforeEach
    void setUp() {
        tenant = User.builder()
                .id(1L)
                .email("tenant@rentspace.com")
                .fullName("Nguyen Van Tenant")
                .role(Role.TENANT)
                .build();

        landlord = User.builder()
                .id(2L)
                .email("landlord@rentspace.com")
                .fullName("Nguyen Van Landlord")
                .role(Role.LANDLORD)
                .build();

        admin = User.builder()
                .id(99L)
                .email("admin@rentspace.com")
                .fullName("System Admin")
                .role(Role.ADMIN)
                .build();

        listing = Listing.builder()
                .id(10L)
                .title("Phòng trọ cao cấp")
                .landlord(landlord)
                .build();

        review = Review.builder()
                .id(100L)
                .listing(listing)
                .tenant(tenant)
                .rating(5)
                .comment("Phòng rất tốt")
                .cleanlinessRating(5)
                .securityRating(4)
                .landlordRating(5)
                .createdAt(LocalDateTime.now())
                .build();
    }

    // =========================================================================
    // GET REVIEWS BY LISTING
    // =========================================================================
    @Nested
    @DisplayName("GET /api/v1/listings/{listingId}/reviews")
    class GetReviewsTests {

        @Test
        @DisplayName("Lấy danh sách đánh giá thành công")
        void getReviewsByListing_whenListingExists_shouldReturnPage() {
            // Given
            Pageable pageable = PageRequest.of(0, 10);
            Page<Review> reviewPage = new PageImpl<>(Collections.singletonList(review), pageable, 1);
            ReviewResponse mockResponse = ReviewResponse.builder()
                    .id(100L)
                    .listingId(10L)
                    .rating(5)
                    .comment("Phòng rất tốt")
                    .build();

            when(listingRepository.existsById(10L)).thenReturn(true);
            when(reviewRepository.findByListingId(10L, pageable)).thenReturn(reviewPage);
            when(reviewMapper.toResponse(review)).thenReturn(mockResponse);

            // When
            Page<ReviewResponse> result = reviewService.getReviewsByListing(10L, pageable);

            // Then
            assertNotNull(result);
            assertEquals(1, result.getTotalElements());
            assertEquals(100L, result.getContent().get(0).getId());
            verify(reviewRepository).findByListingId(10L, pageable);
        }

        @Test
        @DisplayName("Phòng trọ không tồn tại — ném ResourceNotFoundException")
        void getReviewsByListing_whenListingNotFound_shouldThrowException() {
            // Given
            when(listingRepository.existsById(999L)).thenReturn(false);

            // When & Then
            assertThrows(ResourceNotFoundException.class,
                    () -> reviewService.getReviewsByListing(999L, PageRequest.of(0, 10)));
            verify(reviewRepository, never()).findByListingId(anyLong(), any());
        }
    }

    // =========================================================================
    // CREATE REVIEW
    // =========================================================================
    @Nested
    @DisplayName("POST /api/v1/listings/{listingId}/reviews")
    class CreateReviewTests {

        private ReviewRequest createRequest() {
            ReviewRequest request = new ReviewRequest();
            request.setRating(4);
            request.setComment("Phòng sạch sẽ");
            request.setCleanlinessRating(5);
            request.setSecurityRating(4);
            request.setLandlordRating(4);
            return request;
        }

        @Test
        @DisplayName("Tạo đánh giá thành công — map đúng các trường rating breakdown")
        void createReview_withValidRequest_shouldSaveAndReturnResponse() {
            // Given
            ReviewRequest request = createRequest();
            when(userRepository.findByEmail("tenant@rentspace.com")).thenReturn(Optional.of(tenant));
            when(listingRepository.findById(10L)).thenReturn(Optional.of(listing));
            when(reviewRepository.existsByListingIdAndTenantId(10L, 1L)).thenReturn(false);
            when(reviewRepository.save(any(Review.class))).thenReturn(review);
            when(reviewMapper.toResponse(any(Review.class))).thenReturn(
                    ReviewResponse.builder().id(100L).build()
            );

            // When
            ReviewResponse response = reviewService.createReview(10L, "tenant@rentspace.com", request);

            // Then — Xác thực data lưu vào DB
            ArgumentCaptor<Review> reviewCaptor = ArgumentCaptor.forClass(Review.class);
            verify(reviewRepository).save(reviewCaptor.capture());
            Review savedReview = reviewCaptor.getValue();

            assertEquals(10L, savedReview.getListing().getId());
            assertEquals(1L, savedReview.getTenant().getId());
            assertEquals(4, savedReview.getRating());
            assertEquals("Phòng sạch sẽ", savedReview.getComment());
            assertEquals(5, savedReview.getCleanlinessRating());
            assertEquals(4, savedReview.getSecurityRating());
            assertEquals(4, savedReview.getLandlordRating());

            assertNotNull(response);
            assertEquals(100L, response.getId());
        }

        @Test
        @DisplayName("Chỉ người thuê (Tenant) mới được đánh giá — Landlord đánh giá sẽ bị chặn")
        void createReview_whenNotTenant_shouldThrowException() {
            // Given
            ReviewRequest request = createRequest();
            when(userRepository.findByEmail("landlord@rentspace.com")).thenReturn(Optional.of(landlord));

            // When & Then
            BusinessException exception = assertThrows(BusinessException.class,
                    () -> reviewService.createReview(10L, "landlord@rentspace.com", request));

            assertTrue(exception.getMessage().contains("Chỉ người thuê"));
            verify(reviewRepository, never()).save(any());
        }

        @Test
        @DisplayName("Không được tự đánh giá phòng của chính mình")
        void createReview_onOwnListing_shouldThrowException() {
            // Given
            ReviewRequest request = createRequest();
            User landlordTenant = User.builder().id(2L).role(Role.TENANT).email("landlord_tenant@rentspace.com").build();
            listing.setLandlord(landlordTenant); // Thiết lập chủ nhà trùng ID với người review

            when(userRepository.findByEmail("landlord_tenant@rentspace.com")).thenReturn(Optional.of(landlordTenant));
            when(listingRepository.findById(10L)).thenReturn(Optional.of(listing));

            // When & Then
            BusinessException exception = assertThrows(BusinessException.class,
                    () -> reviewService.createReview(10L, "landlord_tenant@rentspace.com", request));

            assertTrue(exception.getMessage().contains("tự đánh giá phòng trọ của chính mình"));
            verify(reviewRepository, never()).save(any());
        }

        @Test
        @DisplayName("Mỗi Tenant chỉ được đánh giá 1 lần cho mỗi phòng trọ")
        void createReview_alreadyReviewed_shouldThrowException() {
            // Given
            ReviewRequest request = createRequest();
            when(userRepository.findByEmail("tenant@rentspace.com")).thenReturn(Optional.of(tenant));
            when(listingRepository.findById(10L)).thenReturn(Optional.of(listing));
            when(reviewRepository.existsByListingIdAndTenantId(10L, 1L)).thenReturn(true);

            // When & Then
            BusinessException exception = assertThrows(BusinessException.class,
                    () -> reviewService.createReview(10L, "tenant@rentspace.com", request));

            assertTrue(exception.getMessage().contains("đã gửi đánh giá"));
            verify(reviewRepository, never()).save(any());
        }
    }

    // =========================================================================
    // UPDATE REVIEW
    // =========================================================================
    @Nested
    @DisplayName("PUT /api/v1/reviews/{id}")
    class UpdateReviewTests {

        private ReviewRequest createUpdateRequest() {
            ReviewRequest request = new ReviewRequest();
            request.setRating(3);
            request.setComment("Cập nhật lại: Ồn ào hơn trước");
            request.setCleanlinessRating(3);
            request.setSecurityRating(3);
            request.setLandlordRating(3);
            return request;
        }

        @Test
        @DisplayName("Cập nhật thành công — cập nhật cả breakdown ratings")
        void updateReview_byAuthor_shouldSaveAndReturnResponse() {
            // Given
            ReviewRequest request = createUpdateRequest();
            when(reviewRepository.findById(100L)).thenReturn(Optional.of(review));
            when(userRepository.findByEmail("tenant@rentspace.com")).thenReturn(Optional.of(tenant));
            when(reviewRepository.save(any(Review.class))).thenReturn(review);
            when(reviewMapper.toResponse(any(Review.class))).thenReturn(ReviewResponse.builder().id(100L).build());

            // When
            ReviewResponse response = reviewService.updateReview(100L, "tenant@rentspace.com", request);

            // Then
            assertEquals(3, review.getRating());
            assertEquals("Cập nhật lại: Ồn ào hơn trước", review.getComment());
            assertEquals(3, review.getCleanlinessRating());
            assertEquals(3, review.getSecurityRating());
            assertEquals(3, review.getLandlordRating());
            assertNotNull(response);
        }

        @Test
        @DisplayName("Không được cập nhật đánh giá của người khác")
        void updateReview_byOtherUser_shouldThrowException() {
            // Given
            ReviewRequest request = createUpdateRequest();
            User otherUser = User.builder().id(3L).email("other@rentspace.com").role(Role.TENANT).build();

            when(reviewRepository.findById(100L)).thenReturn(Optional.of(review));
            when(userRepository.findByEmail("other@rentspace.com")).thenReturn(Optional.of(otherUser));

            // When & Then
            BusinessException exception = assertThrows(BusinessException.class,
                    () -> reviewService.updateReview(100L, "other@rentspace.com", request));

            assertTrue(exception.getMessage().contains("chỉnh sửa đánh giá của người khác"));
            verify(reviewRepository, never()).save(review);
        }
    }

    // =========================================================================
    // DELETE REVIEW
    // =========================================================================
    @Nested
    @DisplayName("DELETE /api/v1/reviews/{id}")
    class DeleteReviewTests {

        @Test
        @DisplayName("Chủ đánh giá có quyền xóa đánh giá")
        void deleteReview_byAuthor_shouldDelete() {
            // Given
            when(reviewRepository.findById(100L)).thenReturn(Optional.of(review));
            when(userRepository.findByEmail("tenant@rentspace.com")).thenReturn(Optional.of(tenant));

            // When
            reviewService.deleteReview(100L, "tenant@rentspace.com");

            // Then
            verify(reviewRepository).delete(review);
        }

        @Test
        @DisplayName("Admin có quyền xóa mọi đánh giá")
        void deleteReview_byAdmin_shouldDelete() {
            // Given
            when(reviewRepository.findById(100L)).thenReturn(Optional.of(review));
            when(userRepository.findByEmail("admin@rentspace.com")).thenReturn(Optional.of(admin));

            // When
            reviewService.deleteReview(100L, "admin@rentspace.com");

            // Then
            verify(reviewRepository).delete(review);
        }

        @Test
        @DisplayName("Người khác không có quyền xóa đánh giá — ném BusinessException")
        void deleteReview_byStranger_shouldThrowException() {
            // Given
            User stranger = User.builder().id(5L).email("stranger@rentspace.com").role(Role.TENANT).build();
            when(reviewRepository.findById(100L)).thenReturn(Optional.of(review));
            when(userRepository.findByEmail("stranger@rentspace.com")).thenReturn(Optional.of(stranger));

            // When & Then
            BusinessException exception = assertThrows(BusinessException.class,
                    () -> reviewService.deleteReview(100L, "stranger@rentspace.com"));

            assertTrue(exception.getMessage().contains("không có quyền xóa"));
            verify(reviewRepository, never()).delete(any());
        }
    }
}
