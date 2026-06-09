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
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service triển khai các nghiệp vụ của Review.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final ReviewMapper reviewMapper;

    @Override
    public Page<ReviewResponse> getReviewsByListing(Long listingId, Pageable pageable) {
        // Kiểm tra xem phòng trọ có tồn tại không
        if (!listingRepository.existsById(listingId)) {
            throw new ResourceNotFoundException("Không tìm thấy phòng trọ với id: " + listingId);
        }

        return reviewRepository.findByListingId(listingId, pageable)
                .map(reviewMapper::toResponse);
    }

    @Override
    @Transactional
    public ReviewResponse createReview(Long listingId, String tenantEmail, ReviewRequest request) {
        // Lấy thông tin Tenant
        User tenant = userRepository.findByEmail(tenantEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với email: " + tenantEmail));

        // Kiểm tra xem người dùng có phải là Tenant không
        if (tenant.getRole() != Role.TENANT) {
            throw new BusinessException("Chỉ người thuê (Tenant) mới được phép viết đánh giá");
        }

        // Lấy thông tin phòng trọ
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng trọ với id: " + listingId));

        // Ràng buộc: Tenant không được tự đánh giá phòng của chính mình
        if (listing.getLandlord().getId().equals(tenant.getId())) {
            throw new BusinessException("Bạn không thể tự đánh giá phòng trọ của chính mình");
        }

        // Ràng buộc: Mỗi Tenant chỉ được đánh giá 1 lần cho mỗi phòng trọ
        if (reviewRepository.existsByListingIdAndTenantId(listingId, tenant.getId())) {
            throw new BusinessException("Bạn đã gửi đánh giá cho phòng trọ này rồi");
        }

        // Tạo thực thể Review mới
        Review review = Review.builder()
                .listing(listing)
                .tenant(tenant)
                .rating(request.getRating())
                .comment(request.getComment())
                .cleanlinessRating(request.getCleanlinessRating())
                .securityRating(request.getSecurityRating())
                .landlordRating(request.getLandlordRating())
                .build();

        Review savedReview = reviewRepository.save(review);
        return reviewMapper.toResponse(savedReview);
    }

    @Override
    @Transactional
    public ReviewResponse updateReview(Long reviewId, String tenantEmail, ReviewRequest request) {
        // Tìm bài đánh giá
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá với id: " + reviewId));

        // Lấy thông tin Tenant sửa đổi
        User tenant = userRepository.findByEmail(tenantEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với email: " + tenantEmail));

        // Kiểm tra quyền sở hữu bài đánh giá
        if (!review.getTenant().getId().equals(tenant.getId())) {
            throw new BusinessException("Bạn không có quyền chỉnh sửa đánh giá của người khác");
        }

        // Cập nhật thông tin
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        review.setCleanlinessRating(request.getCleanlinessRating());
        review.setSecurityRating(request.getSecurityRating());
        review.setLandlordRating(request.getLandlordRating());

        Review updatedReview = reviewRepository.save(review);
        return reviewMapper.toResponse(updatedReview);
    }

    @Override
    @Transactional
    public void deleteReview(Long reviewId, String userEmail) {
        // Tìm bài đánh giá
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá với id: " + reviewId));

        // Lấy thông tin User thực hiện hành động
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với email: " + userEmail));

        // Kiểm tra quyền: Phải là tác giả của đánh giá đó HOẶC phải là ADMIN
        boolean isAuthor = review.getTenant().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == Role.ADMIN;

        if (!isAuthor && !isAdmin) {
            throw new BusinessException("Bạn không có quyền xóa đánh giá này");
        }

        reviewRepository.delete(review);
    }
}
