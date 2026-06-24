package com.rentspace.domain.analytics;

import com.rentspace.domain.analytics.dto.AdminFinancialSummaryDto;
import com.rentspace.domain.analytics.dto.ConversionFunnelDto;
import com.rentspace.domain.analytics.dto.MonthlyRevenueDto;
import com.rentspace.domain.analytics.dto.TopLandlordDto;
import com.rentspace.domain.chat.ConversationRepository;
import com.rentspace.domain.deposit.DepositTransactionRepository;
import com.rentspace.domain.deposit.enums.DepositStatus;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AnalyticsServiceImpl implements AnalyticsService {

    private final EntityManager entityManager;
    private final ConversationRepository conversationRepository;
    private final DepositTransactionRepository depositTransactionRepository;

    @Override
    public ConversionFunnelDto getLandlordFunnel(Long landlordId, LocalDate from, LocalDate to) {
        LocalDateTime fromDt = from.atStartOfDay();
        LocalDateTime toDt   = to.atTime(LocalTime.MAX);

        // Lượt xem: query từ materialized view (nhanh hơn query trực tiếp listing_views)
        Number totalViews = (Number) entityManager.createNativeQuery("""
                SELECT COALESCE(SUM(view_count), 0)
                FROM landlord_analytics_daily
                WHERE landlord_id = :landlordId
                  AND stat_date BETWEEN :from AND :to
                """)
                .setParameter("landlordId", landlordId)
                .setParameter("from", from)
                .setParameter("to", to)
                .getSingleResult();

        // Tin nhắn: conversations không có listing_id nên query trực tiếp
        long totalChats = conversationRepository.countByLandlordIdAndCreatedAtBetween(landlordId, fromDt, toDt);

        // Số lượt đặt cọc
        long totalDeposits = depositTransactionRepository.countByLandlordIdAndPaidAtBetween(landlordId, fromDt, toDt);

        // Số giao dịch thành công (đã giải phóng cọc)
        long successfulDeals = depositTransactionRepository.countByLandlordIdAndStatusAndReleasedAtBetween(
                landlordId, DepositStatus.RELEASED, fromDt, toDt);

        return new ConversionFunnelDto(
                totalViews != null ? totalViews.longValue() : 0L,
                totalChats,
                totalDeposits,
                successfulDeals
        );
    }

    @Override
    public List<MonthlyRevenueDto> getLandlordMonthlyRevenue(Long landlordId, int year) {
        List<Object[]> rows = depositTransactionRepository.findMonthlyStatsByLandlord(landlordId, year);
        List<MonthlyRevenueDto> result = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            int month        = ((Number) row[1]).intValue();
            int depositCount = ((Number) row[2]).intValue();
            long revenue     = ((Number) row[3]).longValue();
            result.add(new MonthlyRevenueDto(year, month, revenue, depositCount));
        }
        return result;
    }

    @Override
    public AdminFinancialSummaryDto getAdminSummary(LocalDate from, LocalDate to) {
        LocalDateTime fromDt = from.atStartOfDay();
        LocalDateTime toDt   = to.atTime(LocalTime.MAX);

        List<Object[]> rows = depositTransactionRepository.findAdminSummary(fromDt, toDt);
        // Query aggregate always returns 1 row (even with no data — COALESCEs return 0/0)
        Object[] row = rows.isEmpty() ? new Object[]{0L, 0L, 0L, 0L} : rows.get(0);
        long totalRevenue       = row[0] instanceof BigDecimal bd ? bd.longValue() : ((Number) row[0]).longValue();
        int  totalTransactions  = ((Number) row[1]).intValue();
        int  activeLandlords    = ((Number) row[2]).intValue();
        long platformFee        = row[3] instanceof BigDecimal bd ? bd.longValue() : ((Number) row[3]).longValue();

        return new AdminFinancialSummaryDto(totalRevenue, totalTransactions, activeLandlords, platformFee);
    }

    @Override
    public List<TopLandlordDto> getTopLandlords(LocalDate from, LocalDate to, int limit) {
        LocalDateTime fromDt = from.atStartOfDay();
        LocalDateTime toDt   = to.atTime(LocalTime.MAX);

        List<Object[]> rows = depositTransactionRepository.findTopLandlords(fromDt, toDt, limit);
        List<TopLandlordDto> result = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            Long   landlordId  = ((Number) row[0]).longValue();
            String displayName = (String) row[1];
            long   revenue     = row[2] instanceof BigDecimal bd ? bd.longValue() : ((Number) row[2]).longValue();
            int    dealCount   = ((Number) row[3]).intValue();
            result.add(new TopLandlordDto(landlordId, displayName, revenue, dealCount));
        }
        return result;
    }
}
