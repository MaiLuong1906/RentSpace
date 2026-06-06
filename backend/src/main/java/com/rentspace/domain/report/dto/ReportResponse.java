package com.rentspace.domain.report.dto;

import com.rentspace.domain.report.enums.ReportStatus;
import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO chứa thông tin trả về của một báo cáo vi phạm phòng trọ.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportResponse {
    private Long id;
    private Long listingId;
    private String listingTitle;
    private Long reporterId;
    private String reporterName;
    private String reason;
    private String description;
    private ReportStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
