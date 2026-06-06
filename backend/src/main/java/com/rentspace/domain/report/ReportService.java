package com.rentspace.domain.report;

import com.rentspace.domain.report.dto.ReportRequest;
import com.rentspace.domain.report.dto.ReportResponse;
import com.rentspace.domain.report.enums.ReportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Interface định nghĩa các nghiệp vụ của Report.
 */
public interface ReportService {

    /**
     * Gửi báo cáo vi phạm phòng trọ.
     */
    ReportResponse submitReport(String reporterEmail, ReportRequest request);

    /**
     * Lấy danh sách báo cáo vi phạm (phân trang, có thể lọc theo trạng thái).
     */
    Page<ReportResponse> getReports(ReportStatus status, Pageable pageable);

    /**
     * Cập nhật trạng thái của báo cáo vi phạm.
     */
    ReportResponse updateReportStatus(Long reportId, ReportStatus status);
}
