package com.rentspace.domain.report.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/**
 * DTO nhận thông tin khi người dùng gửi báo cáo vi phạm phòng trọ.
 */
@Getter
@Setter
public class ReportRequest {

    @NotNull(message = "Listing ID không được để trống")
    private Long listingId;

    @NotBlank(message = "Lý do báo cáo không được để trống")
    @Size(max = 100, message = "Lý do báo cáo không vượt quá 100 ký tự")
    private String reason;

    @Size(max = 1000, message = "Mô tả chi tiết vi phạm không vượt quá 1000 ký tự")
    private String description;
}
