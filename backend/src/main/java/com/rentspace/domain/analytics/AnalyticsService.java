package com.rentspace.domain.analytics;

import com.rentspace.domain.analytics.dto.AdminFinancialSummaryDto;
import com.rentspace.domain.analytics.dto.ConversionFunnelDto;
import com.rentspace.domain.analytics.dto.MonthlyRevenueDto;
import com.rentspace.domain.analytics.dto.TopLandlordDto;

import java.time.LocalDate;
import java.util.List;

public interface AnalyticsService {

    ConversionFunnelDto getLandlordFunnel(Long landlordId, LocalDate from, LocalDate to);

    List<MonthlyRevenueDto> getLandlordMonthlyRevenue(Long landlordId, int year);

    AdminFinancialSummaryDto getAdminSummary(LocalDate from, LocalDate to);

    List<TopLandlordDto> getTopLandlords(LocalDate from, LocalDate to, int limit);
}
