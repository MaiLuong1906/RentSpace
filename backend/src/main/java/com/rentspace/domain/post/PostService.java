package com.rentspace.domain.post;

import com.rentspace.common.exception.BusinessException;
import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.domain.listing.Listing;
import com.rentspace.domain.listing.ListingRepository;
import com.rentspace.domain.post.dto.*;
import com.rentspace.domain.post.enums.PostType;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.enums.KycStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostService {

    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;
    private final PostCommentRepository postCommentRepository;
    private final PostReportRepository postReportRepository;
    private final ListingRepository listingRepository;
    private final PostMapper postMapper;

    /**
     * Tạo bài viết mới kèm theo cơ chế Rate Limit dựa trên trạng thái KYC
     */
    @Transactional
    public PostResponse createPost(PostCreateRequest request, User author) {
        // 1. Kiểm tra Rate Limit
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        long postCountToday = postRepository.countByAuthorIdAndCreatedAtAfter(author.getId(), startOfDay);
        
        int limit = (author.getKycStatus() == KycStatus.VERIFIED) ? 20 : 5;
        if (postCountToday >= limit) {
            log.warn("User ID {} reached post limit today. Limit: {}", author.getId(), limit);
            throw new BusinessException("Bạn đã đạt giới hạn đăng bài trong ngày (" + limit + " bài/ngày). Vui lòng quay lại vào ngày mai.");
        }

        // 2. Tìm Listing liên quan nếu có
        Listing relatedListing = null;
        if (request.getRelatedListingId() != null) {
            relatedListing = listingRepository.findById(request.getRelatedListingId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tin đăng liên quan"));
        }

        // 3. Tạo bài viết
        Post post = Post.builder()
                .author(author)
                .type(request.getType())
                .content(request.getContent())
                .imageUrls(request.getImageUrls() != null ? request.getImageUrls() : Collections.emptyList())
                .relatedListing(relatedListing)
                .district(request.getDistrict())
                .likeCount(0)
                .commentCount(0)
                .reportCount(0)
                .isHidden(false)
                .build();

        Post savedPost = postRepository.save(post);
        log.info("User ID {} created a new post with ID {}", author.getId(), savedPost.getId());

        PostResponse response = postMapper.toResponse(savedPost);
        response.setIsLiked(false);
        return response;
    }

    /**
     * Lấy danh sách bài đăng (Feed) và check trạng thái Liked của user hiện tại
     */
    @Transactional(readOnly = true)
    public Page<PostResponse> getFeed(PostType type, Pageable pageable, User currentUser) {
        Page<Post> postsPage;
        if (type != null) {
            postsPage = postRepository.findByType(type, pageable);
        } else {
            postsPage = postRepository.findAllActive(pageable);
        }

        // Chuyển đổi sang DTO
        Page<PostResponse> responsePage = postsPage.map(postMapper::toResponse);

        // Điền trạng thái isLiked nếu user đã đăng nhập
        if (currentUser != null && !responsePage.isEmpty()) {
            List<Long> postIds = responsePage.getContent().stream()
                    .map(PostResponse::getId)
                    .toList();

            List<Long> likedPostIds = postLikeRepository.findLikedPostIdsByUserIdAndPostIds(currentUser.getId(), postIds);

            responsePage.forEach(postResponse -> {
                postResponse.setIsLiked(likedPostIds.contains(postResponse.getId()));
            });
        } else {
            responsePage.forEach(postResponse -> postResponse.setIsLiked(false));
        }

        return responsePage;
    }

    /**
     * Thả tim (Like/Unlike) bài viết
     */
    @Transactional
    public boolean toggleLike(Long postId, User user) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết"));

        PostLike.PostLikeId likeId = new PostLike.PostLikeId(postId, user.getId());
        boolean exists = postLikeRepository.existsById(likeId);

        if (exists) {
            // Đã like -> Tiến hành Unlike
            postLikeRepository.deleteById(likeId);
            post.setLikeCount(Math.max(0, post.getLikeCount() - 1));
            postRepository.save(post);
            log.info("User ID {} unliked post ID {}", user.getId(), postId);
            return false;
        } else {
            // Chưa like -> Tiến hành Like
            PostLike like = PostLike.builder()
                    .id(likeId)
                    .post(post)
                    .user(user)
                    .build();
            postLikeRepository.save(like);
            post.setLikeCount(post.getLikeCount() + 1);
            postRepository.save(post);
            log.info("User ID {} liked post ID {}", user.getId(), postId);
            return true;
        }
    }

    /**
     * Thêm bình luận vào bài đăng
     */
    @Transactional
    public CommentResponse createComment(Long postId, CommentCreateRequest request, User author) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết"));

        PostComment comment = PostComment.builder()
                .post(post)
                .author(author)
                .content(request.getContent())
                .isHidden(false)
                .build();

        PostComment savedComment = postCommentRepository.save(comment);

        // Tăng số lượng bình luận bài viết
        post.setCommentCount(post.getCommentCount() + 1);
        postRepository.save(post);

        log.info("User ID {} commented on post ID {}", author.getId(), postId);
        return postMapper.toCommentResponse(savedComment);
    }

    /**
     * Lấy danh sách bình luận của bài đăng (Phân trang phẳng)
     */
    @Transactional(readOnly = true)
    public Page<CommentResponse> getComments(Long postId, Pageable pageable) {
        if (!postRepository.existsById(postId)) {
            throw new ResourceNotFoundException("Không tìm thấy bài viết");
        }

        Page<PostComment> commentsPage = postCommentRepository.findByPostIdAndIsHiddenFalseOrderByCreatedAtDesc(postId, pageable);
        return commentsPage.map(postMapper::toCommentResponse);
    }

    /**
     * Báo cáo vi phạm bài đăng kèm cơ chế tự động ẩn bài viết
     */
    @Transactional
    public void reportPost(Long postId, String reason, User reporter) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết"));

        // Kiểm tra xem đã báo cáo chưa
        boolean alreadyReported = postReportRepository.existsByPostIdAndReporterId(postId, reporter.getId());
        if (alreadyReported) {
            throw new BusinessException("Bạn đã báo cáo bài viết này trước đó rồi.");
        }

        PostReport report = PostReport.builder()
                .post(post)
                .reporter(reporter)
                .reason(reason)
                .build();

        postReportRepository.save(report);

        // Cập nhật lượt report của bài viết
        post.setReportCount(post.getReportCount() + 1);

        // Auto-moderation: Tự động ẩn bài viết nếu nhận được >= 3 reports
        if (post.getReportCount() >= 3) {
            post.setIsHidden(true);
            log.info("Post ID {} has been hidden automatically due to receiving {} reports.", postId, post.getReportCount());
        }

        postRepository.save(post);
        log.info("User ID {} reported post ID {}. Reason: {}", reporter.getId(), postId, reason);
    }

    /**
     * Admin ẩn/hiện bài viết thủ công
     */
    @Transactional
    public void setHiddenStatus(Long postId, boolean isHidden) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết"));

        post.setIsHidden(isHidden);
        postRepository.save(post);
        log.info("Admin updated hidden status of post ID {} to {}", postId, isHidden);
    }
}
