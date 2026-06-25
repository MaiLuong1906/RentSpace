package com.rentspace.domain.review.dto;

import java.time.LocalDateTime;

public record PendingReviewInfo(
        Long depositId,
        Long revieweeId,
        String revieweeName,
        String revieweeAvatarUrl,
        String depositStatus,
        LocalDateTime completedAt
) {}
