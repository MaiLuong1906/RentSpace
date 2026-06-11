package com.rentspace.domain.post.dto;

import com.rentspace.domain.post.enums.PostType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostResponse {
    private Long id;
    private PostAuthorDto author;
    private PostType type;
    private String content;
    private List<String> imageUrls;
    private Long relatedListingId;
    private String district;
    private Integer likeCount;
    private Integer commentCount;
    private Boolean isLiked; // Kiểm tra xem user hiện tại đã liked chưa
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
