package com.rentspace.domain.review.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class TransactionReviewResponse {
    private Long id;
    private Long depositId;
    private Long reviewerId;
    private String reviewerName;
    private String reviewerAvatarUrl;
    private String reviewerRole;
    private Short rating;
    private String comment;
    private Boolean isPublished;
    private Instant publishedAt;
    private Boolean isFlagged;
    private Instant createdAt;
}
