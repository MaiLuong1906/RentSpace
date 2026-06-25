package com.rentspace.domain.review.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SubmitReviewRequest {

    @NotNull
    private Long depositId;

    @NotNull
    @Min(1) @Max(5)
    private Short rating;

    private String comment;
}
