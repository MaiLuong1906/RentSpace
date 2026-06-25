package com.rentspace.domain.review;

import com.rentspace.common.exception.BusinessException;
import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.domain.deposit.DepositTransaction;
import com.rentspace.domain.deposit.DepositTransactionRepository;
import com.rentspace.domain.deposit.enums.DepositStatus;
import com.rentspace.domain.review.dto.PendingReviewInfo;
import com.rentspace.domain.review.dto.RatingSummaryResponse;
import com.rentspace.domain.review.dto.SubmitReviewRequest;
import com.rentspace.domain.review.dto.TransactionReviewResponse;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TransactionReviewServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private DepositTransactionRepository depositRepository;
    @Mock private TransactionReviewRepository reviewRepository;
    @Mock private UserRatingSummaryRepository ratingSummaryRepository;
    @Mock private ReviewModerationService moderationService;

    @InjectMocks
    private TransactionReviewServiceImpl service;

    private com.rentspace.domain.user.User tenant;
    private com.rentspace.domain.user.User landlord;
    private DepositTransaction deposit;

    @BeforeEach
    void setUp() {
        tenant = com.rentspace.domain.user.User.builder()
                .id(5L).email("tenant1@rentspace.com").fullName("Nguyễn Văn Tuấn")
                .build();
        landlord = com.rentspace.domain.user.User.builder()
                .id(2L).email("landlord1@rentspace.com").fullName("Nguyễn Văn Hùng")
                .build();

        deposit = mock(DepositTransaction.class);
        when(deposit.getId()).thenReturn(34L);
        when(deposit.getTenant()).thenReturn(tenant);
        when(deposit.getLandlord()).thenReturn(landlord);
        when(deposit.getStatus()).thenReturn(DepositStatus.RELEASED);
        when(deposit.getReleasedAt()).thenReturn(LocalDateTime.now().minusDays(5));
        when(deposit.getRefundedAt()).thenReturn(null);
    }

    // =========================================================================
    // SUBMIT REVIEW
    // =========================================================================
    @Nested
    @DisplayName("submitReview")
    class SubmitReview {

        private SubmitReviewRequest request() {
            SubmitReviewRequest r = new SubmitReviewRequest();
            r.setDepositId(34L);
            r.setRating((short) 5);
            r.setComment("Chủ trọ rất nhiệt tình");
            return r;
        }

        @Test
        @DisplayName("Tenant submit review cho landlord thành công")
        void submit_tenantReviewsLandlord_success() {
            when(userRepository.findByEmail("tenant1@rentspace.com")).thenReturn(Optional.of(tenant));
            when(depositRepository.findById(34L)).thenReturn(Optional.of(deposit));
            when(reviewRepository.existsByDepositIdAndReviewerId(34L, 5L)).thenReturn(false);
            when(moderationService.containsBannedContent(anyString())).thenReturn(false);

            TransactionReview saved = TransactionReview.builder()
                    .id(1L).deposit(deposit).reviewer(tenant).reviewee(landlord)
                    .reviewerRole(ReviewerRole.TENANT).rating((short) 5)
                    .comment("Chủ trọ rất nhiệt tình").isPublished(false).isFlagged(false)
                    .build();
            when(reviewRepository.save(any())).thenReturn(saved);
            when(reviewRepository.findAllByDepositId(34L)).thenReturn(List.of(saved));

            TransactionReviewResponse result = service.submitReview("tenant1@rentspace.com", request());

            assertThat(result).isNotNull();
            assertThat(result.getRating()).isEqualTo((short) 5);
            assertThat(result.getReviewerRole()).isEqualTo("TENANT");
            verify(reviewRepository).save(any(TransactionReview.class));
        }

        @Test
        @DisplayName("Deposit chưa hoàn tất (PAID) → BusinessException")
        void submit_depositNotCompleted_throws() {
            when(userRepository.findByEmail("tenant1@rentspace.com")).thenReturn(Optional.of(tenant));
            when(depositRepository.findById(34L)).thenReturn(Optional.of(deposit));
            when(deposit.getStatus()).thenReturn(DepositStatus.PAID);

            assertThatThrownBy(() -> service.submitReview("tenant1@rentspace.com", request()))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("hoàn tất");
            verify(reviewRepository, never()).save(any());
        }

        @Test
        @DisplayName("Quá 30 ngày kể từ ngày hoàn tất → BusinessException")
        void submit_outside30DayWindow_throws() {
            when(userRepository.findByEmail("tenant1@rentspace.com")).thenReturn(Optional.of(tenant));
            when(depositRepository.findById(34L)).thenReturn(Optional.of(deposit));
            when(deposit.getReleasedAt()).thenReturn(LocalDateTime.now().minusDays(31));

            assertThatThrownBy(() -> service.submitReview("tenant1@rentspace.com", request()))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("30 ngày");
            verify(reviewRepository, never()).save(any());
        }

        @Test
        @DisplayName("Submit trùng (đã đánh giá deposit này rồi) → BusinessException")
        void submit_duplicate_throws() {
            when(userRepository.findByEmail("tenant1@rentspace.com")).thenReturn(Optional.of(tenant));
            when(depositRepository.findById(34L)).thenReturn(Optional.of(deposit));
            when(reviewRepository.existsByDepositIdAndReviewerId(34L, 5L)).thenReturn(true);

            assertThatThrownBy(() -> service.submitReview("tenant1@rentspace.com", request()))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("đã gửi đánh giá");
            verify(reviewRepository, never()).save(any());
        }

        @Test
        @DisplayName("User không thuộc giao dịch này → BusinessException")
        void submit_notParty_throws() {
            com.rentspace.domain.user.User stranger = com.rentspace.domain.user.User.builder()
                    .id(99L).email("other@rentspace.com").build();
            when(userRepository.findByEmail("other@rentspace.com")).thenReturn(Optional.of(stranger));
            when(depositRepository.findById(34L)).thenReturn(Optional.of(deposit));

            SubmitReviewRequest req = request();
            assertThatThrownBy(() -> service.submitReview("other@rentspace.com", req))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("không thuộc giao dịch");
            verify(reviewRepository, never()).save(any());
        }

        @Test
        @DisplayName("Comment chứa từ vi phạm → review lưu với isFlagged=true, isPublished=false")
        void submit_bannedContent_savedAsFlagged() {
            when(userRepository.findByEmail("tenant1@rentspace.com")).thenReturn(Optional.of(tenant));
            when(depositRepository.findById(34L)).thenReturn(Optional.of(deposit));
            when(reviewRepository.existsByDepositIdAndReviewerId(34L, 5L)).thenReturn(false);
            when(moderationService.containsBannedContent(anyString())).thenReturn(true);

            TransactionReview flagged = TransactionReview.builder()
                    .id(1L).deposit(deposit).reviewer(tenant).reviewee(landlord)
                    .reviewerRole(ReviewerRole.TENANT).rating((short) 1)
                    .isPublished(false).isFlagged(true).build();
            when(reviewRepository.save(any())).thenReturn(flagged);
            when(reviewRepository.findAllByDepositId(34L)).thenReturn(List.of(flagged));

            SubmitReviewRequest req = request();
            req.setComment("từ vi phạm");
            TransactionReviewResponse result = service.submitReview("tenant1@rentspace.com", req);

            assertThat(result.getIsFlagged()).isTrue();
            assertThat(result.getIsPublished()).isFalse();
        }
    }

    // =========================================================================
    // BLIND REVIEW — publish khi cả hai submit
    // =========================================================================
    @Nested
    @DisplayName("Blind review logic")
    class BlindReview {

        @Test
        @DisplayName("Chỉ 1 bên submit → isPublished vẫn false")
        void oneSubmit_notPublished() {
            when(userRepository.findByEmail("tenant1@rentspace.com")).thenReturn(Optional.of(tenant));
            when(depositRepository.findById(34L)).thenReturn(Optional.of(deposit));
            when(reviewRepository.existsByDepositIdAndReviewerId(34L, 5L)).thenReturn(false);
            when(moderationService.containsBannedContent(any())).thenReturn(false);

            TransactionReview tenantReview = TransactionReview.builder()
                    .id(1L).deposit(deposit).reviewer(tenant).reviewee(landlord)
                    .reviewerRole(ReviewerRole.TENANT).rating((short) 4)
                    .isPublished(false).isFlagged(false).build();
            when(reviewRepository.save(any())).thenReturn(tenantReview);
            // Chỉ 1 review → chưa đủ để publish
            when(reviewRepository.findAllByDepositId(34L)).thenReturn(List.of(tenantReview));

            SubmitReviewRequest req = new SubmitReviewRequest();
            req.setDepositId(34L); req.setRating((short) 4);
            service.submitReview("tenant1@rentspace.com", req);

            // tryPublishPair không save với isPublished=true khi chỉ 1 review
            verify(ratingSummaryRepository, never()).save(any());
        }

        @Test
        @DisplayName("Cả 2 bên submit → cả 2 được publish và rating summary được cập nhật")
        void bothSubmit_bothPublished() {
            when(userRepository.findByEmail("landlord1@rentspace.com")).thenReturn(Optional.of(landlord));
            when(depositRepository.findById(34L)).thenReturn(Optional.of(deposit));
            // Landlord là bên submit thứ 2
            when(deposit.getTenant()).thenReturn(tenant);
            when(deposit.getLandlord()).thenReturn(landlord);
            when(reviewRepository.existsByDepositIdAndReviewerId(34L, 2L)).thenReturn(false);
            when(moderationService.containsBannedContent(any())).thenReturn(false);

            TransactionReview landlordReview = TransactionReview.builder()
                    .id(2L).deposit(deposit).reviewer(landlord).reviewee(tenant)
                    .reviewerRole(ReviewerRole.LANDLORD).rating((short) 5)
                    .isPublished(false).isFlagged(false).build();
            when(reviewRepository.save(any())).thenReturn(landlordReview);

            // Cả 2 review đã có
            TransactionReview tenantReview = TransactionReview.builder()
                    .id(1L).deposit(deposit).reviewer(tenant).reviewee(landlord)
                    .reviewerRole(ReviewerRole.TENANT).rating((short) 4)
                    .isPublished(false).isFlagged(false).build();
            when(reviewRepository.findAllByDepositId(34L)).thenReturn(List.of(tenantReview, landlordReview));
            when(ratingSummaryRepository.findByUserId(anyLong())).thenReturn(Optional.empty());
            when(userRepository.findById(anyLong())).thenReturn(Optional.of(landlord));
            when(ratingSummaryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            SubmitReviewRequest req = new SubmitReviewRequest();
            req.setDepositId(34L); req.setRating((short) 5);
            service.submitReview("landlord1@rentspace.com", req);

            // Rating summary phải được cập nhật cho cả 2 reviewee
            verify(ratingSummaryRepository, atLeast(1)).save(any(UserRatingSummary.class));
        }
    }

    // =========================================================================
    // GET MY PENDING REVIEWS
    // =========================================================================
    @Nested
    @DisplayName("getMyPendingReviews")
    class GetMyPending {

        @Test
        @DisplayName("Trả về deposit RELEASED chưa review trong 30 ngày")
        void returns_unreviewed_deposits() {
            when(userRepository.findByEmail("tenant1@rentspace.com")).thenReturn(Optional.of(tenant));
            when(depositRepository.findCompletedDepositsForUser(eq(5L), any(LocalDateTime.class)))
                    .thenReturn(List.of(deposit));
            when(reviewRepository.findDepositIdsReviewedByUser(5L)).thenReturn(Set.of());

            List<PendingReviewInfo> result = service.getMyPendingReviews("tenant1@rentspace.com");

            assertThat(result).hasSize(1);
            assertThat(result.get(0).depositId()).isEqualTo(34L);
            assertThat(result.get(0).revieweeId()).isEqualTo(2L);
        }

        @Test
        @DisplayName("Deposit đã review → không xuất hiện trong danh sách pending")
        void already_reviewed_excluded() {
            when(userRepository.findByEmail("tenant1@rentspace.com")).thenReturn(Optional.of(tenant));
            when(depositRepository.findCompletedDepositsForUser(eq(5L), any(LocalDateTime.class)))
                    .thenReturn(List.of(deposit));
            when(reviewRepository.findDepositIdsReviewedByUser(5L)).thenReturn(Set.of(34L));

            List<PendingReviewInfo> result = service.getMyPendingReviews("tenant1@rentspace.com");

            assertThat(result).isEmpty();
        }
    }

    // =========================================================================
    // GET RATING SUMMARY
    // =========================================================================
    @Nested
    @DisplayName("getUserRatingSummary")
    class GetRatingSummary {

        @Test
        @DisplayName("User chưa có review → trả về summary rỗng (totalReviews=0)")
        void noReviews_returnsEmptySummary() {
            when(ratingSummaryRepository.findByUserId(2L)).thenReturn(Optional.empty());

            RatingSummaryResponse result = service.getUserRatingSummary(2L);

            assertThat(result.getTotalReviews()).isZero();
            assertThat(result.getAverageRating()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("User có reviews → trả về đúng avg và count")
        void withReviews_returnsCorrectSummary() {
            UserRatingSummary summary = UserRatingSummary.builder()
                    .user(landlord)
                    .totalReviews(3)
                    .averageRating(new BigDecimal("4.33"))
                    .rating4Count(2).rating5Count(1)
                    .build();
            when(ratingSummaryRepository.findByUserId(2L)).thenReturn(Optional.of(summary));

            RatingSummaryResponse result = service.getUserRatingSummary(2L);

            assertThat(result.getTotalReviews()).isEqualTo(3);
            assertThat(result.getAverageRating()).isEqualByComparingTo(new BigDecimal("4.33"));
        }
    }
}
