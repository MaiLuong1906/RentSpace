package com.rentspace.domain.report.dto;

import com.rentspace.domain.report.enums.ReportStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

/**
 * DTO nhận thông tin khi Admin cập nhật trạng thái của báo cáo vi phạm.
 */
@Getter
@Setter
public class ReportStatusUpdateRequest {

    @NotNull(message = "Trạng thái xử lý không được để trống")
    private ReportStatus status;
}
