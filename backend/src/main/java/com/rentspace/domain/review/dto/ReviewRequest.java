package com.rentspace.domain.review.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/**
 * DTO nhận dữ liệu gửi lên khi Tenant viết hoặc cập nhật đánh giá.
 */
@Getter
@Setter
public class ReviewRequest {

    @NotNull(message = "Điểm đánh giá không được để trống")
    @Min(value = 1, message = "Điểm đánh giá tối thiểu là 1 sao")
    @Max(value = 5, message = "Điểm đánh giá tối đa là 5 sao")
    private Integer rating;

    @Size(max = 1000, message = "Nội dung bình luận không được vượt quá 1000 ký tự")
    private String comment;

    // Đánh giá chi tiết (không bắt buộc, 1-5 sao)
    @Min(value = 1, message = "Điểm vệ sinh tối thiểu là 1")
    @Max(value = 5, message = "Điểm vệ sinh tối đa là 5")
    private Integer cleanlinessRating;

    @Min(value = 1, message = "Điểm an ninh tối thiểu là 1")
    @Max(value = 5, message = "Điểm an ninh tối đa là 5")
    private Integer securityRating;

    @Min(value = 1, message = "Điểm thái độ chủ trọ tối thiểu là 1")
    @Max(value = 5, message = "Điểm thái độ chủ trọ tối đa là 5")
    private Integer landlordRating;
}
