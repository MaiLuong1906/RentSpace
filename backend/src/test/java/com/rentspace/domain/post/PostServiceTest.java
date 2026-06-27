package com.rentspace.domain.post;

import com.rentspace.common.exception.BusinessException;
import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.domain.listing.Listing;
import com.rentspace.domain.listing.ListingRepository;
import com.rentspace.domain.post.dto.CommentCreateRequest;
import com.rentspace.domain.post.dto.CommentResponse;
import com.rentspace.domain.post.dto.PostCreateRequest;
import com.rentspace.domain.post.dto.PostResponse;
import com.rentspace.domain.post.enums.PostType;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import com.rentspace.domain.user.enums.KycStatus;
import com.rentspace.domain.user.enums.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PostServiceTest {

    @Mock
    private PostRepository postRepository;

    @Mock
    private PostLikeRepository postLikeRepository;

    @Mock
    private PostCommentRepository postCommentRepository;

    @Mock
    private PostReportRepository postReportRepository;

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private com.rentspace.domain.notification.NotificationService notificationService;

    @Mock
    private PostMapper postMapper;

    @InjectMocks
    private PostService postService;

    private User user;
    private Post post;
    private Listing listing;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(1L)
                .email("test@example.com")
                .fullName("Test User")
                .kycStatus(KycStatus.PENDING)
                .build();

        listing = Listing.builder()
                .id(100L)
                .title("Test Listing")
                .build();

        post = Post.builder()
                .id(10L)
                .author(user)
                .type(PostType.ROOMMATE)
                .content("Cần tìm bạn ở ghép")
                .likeCount(0)
                .commentCount(0)
                .reportCount(0)
                .isHidden(false)
                .build();
    }

    @Test
    void createPost_Success() {
        PostCreateRequest request = PostCreateRequest.builder()
                .type(PostType.ROOMMATE)
                .content("Cần tìm bạn ở ghép")
                .relatedListingId(100L)
                .build();

        when(postRepository.countByAuthorIdAndCreatedAtAfter(any(), any())).thenReturn(2L);
        when(listingRepository.findById(100L)).thenReturn(Optional.of(listing));
        when(postRepository.save(any())).thenReturn(post);
        when(postMapper.toResponse(any())).thenReturn(new PostResponse());

        PostResponse response = postService.createPost(request, user);

        assertNotNull(response);
        verify(postRepository, times(1)).save(any());
    }

    @Test
    void createPost_RateLimitExceeded() {
        PostCreateRequest request = PostCreateRequest.builder()
                .type(PostType.ROOMMATE)
                .content("Cần tìm bạn ở ghép")
                .build();

        // User chưa KYC (limit = 5), hôm nay đã đăng 5 bài
        when(postRepository.countByAuthorIdAndCreatedAtAfter(any(), any())).thenReturn(5L);

        assertThrows(BusinessException.class, () -> postService.createPost(request, user));
        verify(postRepository, never()).save(any());
    }

    @Test
    void getFeed_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Post> postsPage = new PageImpl<>(List.of(post));
        
        when(postRepository.findAllActive(pageable)).thenReturn(postsPage);
        when(postMapper.toResponse(post)).thenReturn(PostResponse.builder().id(10L).build());
        when(postLikeRepository.findLikedPostIdsByUserIdAndPostIds(any(), any()))
                .thenReturn(List.of(10L)); // Đã thích bài post ID 10

        Page<PostResponse> feed = postService.getFeed(null, pageable, user);

        assertNotNull(feed);
        assertEquals(1, feed.getContent().size());
        assertTrue(feed.getContent().get(0).getIsLiked());
    }

    @Test
    void toggleLike_LikePost() {
        when(postRepository.findById(10L)).thenReturn(Optional.of(post));
        when(postLikeRepository.existsById(any())).thenReturn(false); // Chưa like

        boolean result = postService.toggleLike(10L, user);

        assertTrue(result);
        assertEquals(1, post.getLikeCount());
        verify(postLikeRepository, times(1)).save(any());
        verify(postRepository, times(1)).save(post);
    }

    @Test
    void toggleLike_UnlikePost() {
        post.setLikeCount(1);
        when(postRepository.findById(10L)).thenReturn(Optional.of(post));
        when(postLikeRepository.existsById(any())).thenReturn(true); // Đã like trước đó

        boolean result = postService.toggleLike(10L, user);

        assertFalse(result);
        assertEquals(0, post.getLikeCount());
        verify(postLikeRepository, times(1)).deleteById(any());
        verify(postRepository, times(1)).save(post);
    }

    @Test
    void createComment_Success() {
        CommentCreateRequest request = CommentCreateRequest.builder()
                .content("Bình luận hay quá!")
                .build();

        when(postRepository.findById(10L)).thenReturn(Optional.of(post));
        when(postCommentRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(postMapper.toCommentResponse(any())).thenReturn(new CommentResponse());

        CommentResponse response = postService.createComment(10L, request, user);

        assertNotNull(response);
        assertEquals(1, post.getCommentCount());
        verify(postCommentRepository, times(1)).save(any());
        verify(postRepository, times(1)).save(post);
    }

    @Test
    void reportPost_NoAutoModeration_RemainsVisible() {
        post.setReportCount(2); // Đã có 2 report trước đó
        when(postRepository.findById(10L)).thenReturn(Optional.of(post));
        when(postReportRepository.existsByPostIdAndReporterId(10L, 1L)).thenReturn(false);

        postService.reportPost(10L, "SPAM", user);

        assertEquals(3, post.getReportCount());
        assertFalse(post.getIsHidden()); // Không tự động ẩn nữa, chờ admin duyệt
        verify(postReportRepository, times(1)).save(any());
        verify(postRepository, times(1)).save(post);
    }
}
