package com.rentspace.domain.review.dto;

import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO chứa thông tin trả về của một đánh giá phòng trọ.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponse {
    private Long id;
    private Long listingId;
    private ReviewAuthorResponse author;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
