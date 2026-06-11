package com.rentspace.domain.post;

import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.common.response.ApiResponse;
import com.rentspace.domain.post.dto.*;
import com.rentspace.domain.post.enums.PostType;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/posts")
@RequiredArgsConstructor
@Tag(name = "Community Feed", description = "Các API bảng tin cộng đồng (đăng bài, thả tim, bình luận, báo cáo)")
public class PostController {

    private final PostService postService;
    private final UserRepository userRepository;

    @PostMapping
    @Operation(summary = "Đăng bài viết mới lên bảng tin")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<PostResponse>> createPost(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody PostCreateRequest request) {
        User author = getAuthenticatedUser(userDetails);
        PostResponse response = postService.createPost(request, author);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đăng bài viết thành công", response));
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách bài đăng (Feed cộng đồng)")
    public ResponseEntity<ApiResponse<Page<PostResponse>>> getFeed(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) PostType type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        User currentUser = userDetails != null ? 
                userRepository.findByEmail(userDetails.getUsername()).orElse(null) : null;
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<PostResponse> feed = postService.getFeed(type, pageable, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Tải danh sách bài đăng thành công", feed));
    }

    @PostMapping("/{id}/like")
    @Operation(summary = "Thích / Bỏ thích bài viết (Like / Unlike)")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<Boolean>> toggleLike(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        User user = getAuthenticatedUser(userDetails);
        boolean liked = postService.toggleLike(id, user);
        String message = liked ? "Đã thích bài viết" : "Đã bỏ thích bài viết";
        return ResponseEntity.ok(ApiResponse.success(message, liked));
    }

    @PostMapping("/{id}/comments")
    @Operation(summary = "Thêm bình luận mới vào bài viết")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<CommentResponse>> createComment(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody CommentCreateRequest request) {
        User author = getAuthenticatedUser(userDetails);
        CommentResponse response = postService.createComment(id, request, author);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Bình luận thành công", response));
    }

    @GetMapping("/{id}/comments")
    @Operation(summary = "Lấy danh sách bình luận của bài viết")
    public ResponseEntity<ApiResponse<Page<CommentResponse>>> getComments(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<CommentResponse> comments = postService.getComments(id, pageable);
        return ResponseEntity.ok(ApiResponse.success("Tải danh sách bình luận thành công", comments));
    }

    @PostMapping("/{id}/report")
    @Operation(summary = "Báo cáo vi phạm bài viết")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<String>> reportPost(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @RequestParam String reason) {
        User reporter = getAuthenticatedUser(userDetails);
        postService.reportPost(id, reason, reporter);
        return ResponseEntity.ok(ApiResponse.success("Báo cáo vi phạm thành công", null));
    }

    @PatchMapping("/{id}/hidden")
    @Operation(summary = "[ADMIN] Ẩn/hiện bài viết thủ công")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> setHiddenStatus(
            @PathVariable Long id,
            @RequestParam boolean isHidden) {
        postService.setHiddenStatus(id, isHidden);
        String message = isHidden ? "Đã ẩn bài viết" : "Đã hiển thị lại bài viết";
        return ResponseEntity.ok(ApiResponse.success(message, null));
    }

    private User getAuthenticatedUser(UserDetails userDetails) {
        if (userDetails == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Bạn cần đăng nhập để thực hiện thao tác này");
        }
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản"));
    }
}
