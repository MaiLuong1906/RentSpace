package com.rentspace.domain.review.dto;

import lombok.*;

/**
 * DTO chứa thông tin tối giản của tác giả đánh giá (Tenant).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewAuthorResponse {
    private Long id;
    private String fullName;
    private String avatarUrl;
}
