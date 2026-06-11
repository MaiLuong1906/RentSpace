package com.rentspace.domain.post;

import com.rentspace.domain.post.dto.CommentAuthorDto;
import com.rentspace.domain.post.dto.CommentResponse;
import com.rentspace.domain.post.dto.PostAuthorDto;
import com.rentspace.domain.post.dto.PostResponse;
import com.rentspace.domain.user.User;
import com.rentspace.infrastructure.storage.StorageService;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

@Mapper(componentModel = "spring")
public abstract class PostMapper {

    @Autowired
    protected StorageService storageService;

    // Chuyển đổi Post -> PostResponse
    @Mapping(target = "author", source = "author")
    @Mapping(target = "imageUrls", expression = "java(mapImageUrls(post.getImageUrls()))")
    @Mapping(target = "relatedListingId", expression = "java(post.getRelatedListing() != null ? post.getRelatedListing().getId() : null)")
    @Mapping(target = "isLiked", ignore = true) // Sẽ được điền thủ công ở Service layer dựa trên user hiện tại
    public abstract PostResponse toResponse(Post post);

    // Chuyển đổi User -> PostAuthorDto
    @Mapping(target = "name", source = "fullName")
    @Mapping(target = "avatarUrl", expression = "java(user.getAvatarUrl() != null ? storageService.getPresignedUrl(user.getAvatarUrl()) : null)")
    @Mapping(target = "kycStatus", expression = "java(user.getKycStatus() != null ? user.getKycStatus().name() : null)")
    public abstract PostAuthorDto toAuthorDto(User user);

    // Chuyển đổi PostComment -> CommentResponse
    @Mapping(target = "postId", source = "post.id")
    @Mapping(target = "author", source = "author")
    public abstract CommentResponse toCommentResponse(PostComment comment);

    // Chuyển đổi User -> CommentAuthorDto
    @Mapping(target = "name", source = "fullName")
    @Mapping(target = "avatarUrl", expression = "java(user.getAvatarUrl() != null ? storageService.getPresignedUrl(user.getAvatarUrl()) : null)")
    public abstract CommentAuthorDto toCommentAuthorDto(User user);

    // Helper map danh sách ảnh bài viết sang presigned URL
    protected List<String> mapImageUrls(List<String> imageUrls) {
        if (imageUrls == null) return null;
        return imageUrls.stream()
                .map(url -> url != null ? storageService.getPresignedUrl(url) : null)
                .toList();
    }
}
