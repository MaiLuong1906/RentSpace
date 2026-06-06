package com.rentspace.domain.report;

import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.domain.listing.Listing;
import com.rentspace.domain.listing.ListingRepository;
import com.rentspace.domain.report.dto.ReportRequest;
import com.rentspace.domain.report.dto.ReportResponse;
import com.rentspace.domain.report.enums.ReportStatus;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service triển khai các nghiệp vụ của Report.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportServiceImpl implements ReportService {

    private final ReportRepository reportRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final ReportMapper reportMapper;

    @Override
    @Transactional
    public ReportResponse submitReport(String reporterEmail, ReportRequest request) {
        // Lấy thông tin người báo cáo
        User reporter = userRepository.findByEmail(reporterEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với email: " + reporterEmail));

        // Lấy thông tin phòng trọ bị báo cáo
        Listing listing = listingRepository.findById(request.getListingId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng trọ với id: " + request.getListingId()));

        // Tạo thực thể báo cáo mới
        Report report = Report.builder()
                .reporter(reporter)
                .listing(listing)
                .reason(request.getReason())
                .description(request.getDescription())
                .status(ReportStatus.PENDING)
                .build();

        Report savedReport = reportRepository.save(report);
        return reportMapper.toResponse(savedReport);
    }

    @Override
    public Page<ReportResponse> getReports(ReportStatus status, Pageable pageable) {
        if (status == null) {
            return reportRepository.findAll(pageable).map(reportMapper::toResponse);
        }
        return reportRepository.findByStatus(status, pageable).map(reportMapper::toResponse);
    }

    @Override
    @Transactional
    public ReportResponse updateReportStatus(Long reportId, ReportStatus status) {
        // Tìm báo cáo
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy báo cáo vi phạm với id: " + reportId));

        // Cập nhật trạng thái
        report.setStatus(status);

        // Nếu báo cáo được xác nhận (RESOLVED) -> tự động ẩn tin đăng (INACTIVE)
        if (status == ReportStatus.RESOLVED) {
            Listing listing = report.getListing();
            listing.setStatus(com.rentspace.domain.listing.enums.ListingStatus.INACTIVE);
            listingRepository.save(listing);
        }

        Report updatedReport = reportRepository.save(report);
        return reportMapper.toResponse(updatedReport);
    }
}
