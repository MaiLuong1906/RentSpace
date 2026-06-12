package com.rentspace.domain.analytics;

import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.domain.analytics.dto.DailyViewCount;
import com.rentspace.domain.analytics.dto.LandlordAnalyticsResponse;
import com.rentspace.domain.chat.ConversationRepository;
import com.rentspace.domain.deposit.DepositTransactionRepository;
import com.rentspace.domain.listing.ListingViewRepository;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.redis.core.StringRedisTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.concurrent.TimeUnit;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class LandlordAnalyticsService {

    private final ListingViewRepository listingViewRepository;
    private final ConversationRepository conversationRepository;
    private final DepositTransactionRepository depositTransactionRepository;
    private final UserRepository userRepository;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String CACHE_PREFIX = "landlord:analytics:";
    private static final long CACHE_TTL_MINUTES = 15;

    public LandlordAnalyticsResponse getLandlordAnalytics(String email) {
        // 1. Kiểm tra cache Redis trước
        String cacheKey = CACHE_PREFIX + email;
        String cachedData = redisTemplate.opsForValue().get(cacheKey);
        if (cachedData != null) {
            try {
                log.info("Loaded landlord analytics from Redis cache for email: {}", email);
                return objectMapper.readValue(cachedData, LandlordAnalyticsResponse.class);
            } catch (Exception e) {
                log.warn("Failed to deserialize landlord analytics cache for email: {}", email, e);
            }
        }

        User landlord = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chủ trọ với email: " + email));

        LocalDateTime since = LocalDateTime.now().minusDays(30);

        // 2. Thống kê tổng số views
        long totalViews = listingViewRepository.countByListing_Landlord_IdAndViewedAtAfter(landlord.getId(), since);

        // 3. Thống kê tổng số cuộc hội thoại mới
        long totalMessages = conversationRepository.countByLandlordIdAndCreatedAtAfter(landlord.getId(), since);

        // 4. Thống kê tổng số lượt đặt cọc thành công
        long totalDeposits = depositTransactionRepository.countByLandlordIdAndPaidAtAfter(landlord.getId(), since);

        // 5. Lấy số lượt xem theo ngày (lấp đầy các ngày không có tương tác bằng giá trị 0)
        List<Object[]> dailyViewsData = listingViewRepository.findDailyViewsForLandlord(landlord.getId(), since);

        Map<LocalDate, Long> dailyViewsMap = new LinkedHashMap<>();
        LocalDate today = LocalDate.now();
        for (int i = 29; i >= 0; i--) {
            dailyViewsMap.put(today.minusDays(i), 0L);
        }

        for (Object[] row : dailyViewsData) {
            if (row[0] != null && row[1] != null) {
                LocalDate date;
                if (row[0] instanceof java.sql.Date) {
                    date = ((java.sql.Date) row[0]).toLocalDate();
                } else if (row[0] instanceof LocalDate) {
                    date = (LocalDate) row[0];
                } else {
                    date = LocalDate.parse(row[0].toString());
                }
                long count = ((Number) row[1]).longValue();
                // Chỉ điền vào map nếu ngày nằm trong khoảng 30 ngày qua
                if (dailyViewsMap.containsKey(date)) {
                    dailyViewsMap.put(date, count);
                }
            }
        }

        List<DailyViewCount> viewsOverTime = dailyViewsMap.entrySet().stream()
                .map(e -> new DailyViewCount(e.getKey(), e.getValue()))
                .toList();

        LandlordAnalyticsResponse response = LandlordAnalyticsResponse.builder()
                .totalViews(totalViews)
                .totalMessages(totalMessages)
                .totalDeposits(totalDeposits)
                .viewsOverTime(viewsOverTime)
                .build();

        // 6. Lưu kết quả vào Redis Cache
        try {
            String serialized = objectMapper.writeValueAsString(response);
            redisTemplate.opsForValue().set(cacheKey, serialized, CACHE_TTL_MINUTES, TimeUnit.MINUTES);
            log.info("Cached landlord analytics in Redis for email: {}", email);
        } catch (Exception e) {
            log.warn("Failed to serialize landlord analytics cache for email: {}", email, e);
        }

        return response;
    }
}
