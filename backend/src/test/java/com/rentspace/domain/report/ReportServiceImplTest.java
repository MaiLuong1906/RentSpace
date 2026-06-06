package com.rentspace.domain.report;

import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.domain.listing.Listing;
import com.rentspace.domain.listing.ListingRepository;
import com.rentspace.domain.listing.enums.ListingStatus;
import com.rentspace.domain.report.dto.ReportResponse;
import com.rentspace.domain.report.enums.ReportStatus;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportServiceImplTest {

    @Mock
    private ReportRepository reportRepository;

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ReportMapper reportMapper;

    @InjectMocks
    private ReportServiceImpl reportService;

    private Report pendingReport;
    private Listing targetListing;

    @BeforeEach
    void setUp() {
        targetListing = Listing.builder()
                .id(1L)
                .title("Phòng trọ giá rẻ Quận 1")
                .status(ListingStatus.ACTIVE)
                .build();

        pendingReport = Report.builder()
                .id(10L)
                .listing(targetListing)
                .reason("Thông tin sai lệch")
                .status(ReportStatus.PENDING)
                .build();
    }

    @Test
    void updateReportStatus_WhenResolved_ShouldAutoInactivateListing() {
        // Given
        when(reportRepository.findById(10L)).thenReturn(Optional.of(pendingReport));
        when(reportRepository.save(any(Report.class))).thenAnswer(invocation -> invocation.getArgument(0));
        
        ReportResponse mockResponse = ReportResponse.builder()
                .id(10L)
                .listingId(1L)
                .reason("Thông tin sai lệch")
                .status(ReportStatus.RESOLVED)
                .build();
        when(reportMapper.toResponse(any(Report.class))).thenReturn(mockResponse);

        // When
        ReportResponse response = reportService.updateReportStatus(10L, ReportStatus.RESOLVED);

        // Then
        assertNotNull(response);
        assertEquals(ReportStatus.RESOLVED, response.getStatus());
        assertEquals(ListingStatus.INACTIVE, targetListing.getStatus());
        
        // Verify listingRepository.save was called with the inactive listing
        verify(listingRepository, times(1)).save(targetListing);
        verify(reportRepository, times(1)).save(pendingReport);
    }

    @Test
    void updateReportStatus_WhenDismissed_ShouldNotChangeListingStatus() {
        // Given
        when(reportRepository.findById(10L)).thenReturn(Optional.of(pendingReport));
        when(reportRepository.save(any(Report.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReportResponse mockResponse = ReportResponse.builder()
                .id(10L)
                .listingId(1L)
                .reason("Thông tin sai lệch")
                .status(ReportStatus.DISMISSED)
                .build();
        when(reportMapper.toResponse(any(Report.class))).thenReturn(mockResponse);

        // When
        ReportResponse response = reportService.updateReportStatus(10L, ReportStatus.DISMISSED);

        // Then
        assertNotNull(response);
        assertEquals(ReportStatus.DISMISSED, response.getStatus());
        assertEquals(ListingStatus.ACTIVE, targetListing.getStatus()); // remains ACTIVE

        // Verify listingRepository.save was NOT called
        verify(listingRepository, never()).save(any(Listing.class));
        verify(reportRepository, times(1)).save(pendingReport);
    }

    @Test
    void updateReportStatus_WhenReportNotFound_ShouldThrowException() {
        // Given
        when(reportRepository.findById(99L)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(ResourceNotFoundException.class, () -> 
            reportService.updateReportStatus(99L, ReportStatus.RESOLVED)
        );

        verify(listingRepository, never()).save(any(Listing.class));
        verify(reportRepository, never()).save(any(Report.class));
    }
}
