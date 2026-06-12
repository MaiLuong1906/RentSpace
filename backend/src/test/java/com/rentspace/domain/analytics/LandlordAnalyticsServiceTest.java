package com.rentspace.domain.analytics;

import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.domain.analytics.dto.DailyViewCount;
import com.rentspace.domain.analytics.dto.LandlordAnalyticsResponse;
import com.rentspace.domain.chat.ConversationRepository;
import com.rentspace.domain.deposit.DepositTransactionRepository;
import com.rentspace.domain.listing.ListingViewRepository;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LandlordAnalyticsServiceTest {

    @Mock
    private ListingViewRepository listingViewRepository;

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private DepositTransactionRepository depositTransactionRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private LandlordAnalyticsService landlordAnalyticsService;

    private User landlord;

    @BeforeEach
    void setUp() {
        landlord = User.builder()
                .id(1L)
                .email("landlord@example.com")
                .fullName("Nguyen Landlord")
                .build();
    }

    @Test
    @DisplayName("Lấy thống kê thành công — trả về đầy đủ số liệu và biểu đồ 30 ngày")
    void getLandlordAnalytics_success() {
        // Given
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        List<Object[]> mockDailyViews = new ArrayList<>();
        mockDailyViews.add(new Object[]{java.sql.Date.valueOf(today), 5L});
        mockDailyViews.add(new Object[]{java.sql.Date.valueOf(yesterday), 3L});

        when(userRepository.findByEmail("landlord@example.com")).thenReturn(Optional.of(landlord));
        when(listingViewRepository.countByListing_Landlord_IdAndViewedAtAfter(eq(1L), any(LocalDateTime.class)))
                .thenReturn(100L);
        when(conversationRepository.countByLandlordIdAndCreatedAtAfter(eq(1L), any(LocalDateTime.class)))
                .thenReturn(15L);
        when(depositTransactionRepository.countByLandlordIdAndPaidAtAfter(eq(1L), any(LocalDateTime.class)))
                .thenReturn(4L);
        when(listingViewRepository.findDailyViewsForLandlord(eq(1L), any(LocalDateTime.class)))
                .thenReturn(mockDailyViews);

        // When
        LandlordAnalyticsResponse response = landlordAnalyticsService.getLandlordAnalytics("landlord@example.com");

        // Then
        assertNotNull(response);
        assertEquals(100L, response.getTotalViews());
        assertEquals(15L, response.getTotalMessages());
        assertEquals(4L, response.getTotalDeposits());
        
        // Đảm bảo biểu đồ có đúng 30 ngày
        assertEquals(30, response.getViewsOverTime().size());

        // Kiểm tra số liệu cụ thể ngày hôm nay và hôm qua
        DailyViewCount todayCount = response.getViewsOverTime().stream()
                .filter(d -> d.getDate().equals(today))
                .findFirst().orElseThrow();
        assertEquals(5L, todayCount.getViews());

        DailyViewCount yesterdayCount = response.getViewsOverTime().stream()
                .filter(d -> d.getDate().equals(yesterday))
                .findFirst().orElseThrow();
        assertEquals(3L, yesterdayCount.getViews());

        // Kiểm tra các ngày khác có số lượt xem mặc định là 0
        long zeroCountDays = response.getViewsOverTime().stream()
                .filter(d -> d.getViews() == 0L)
                .count();
        assertEquals(28, zeroCountDays);
    }

    @Test
    @DisplayName("Lấy thống kê thất bại — chủ trọ không tồn tại")
    void getLandlordAnalytics_userNotFound() {
        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, 
                () -> landlordAnalyticsService.getLandlordAnalytics("nonexistent@example.com"));

        verifyNoInteractions(listingViewRepository, conversationRepository, depositTransactionRepository);
    }
}
