package com.rentspace.domain.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LandlordAnalyticsResponse {
    private Long totalViews;
    private Long totalMessages; // Số lượng cuộc hội thoại mới trong 30 ngày qua
    private Long totalDeposits; // Số lượng đặt cọc thành công trong 30 ngày qua
    private List<DailyViewCount> viewsOverTime;
}
