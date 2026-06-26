package com.rentspace.domain.recommendation;

import com.rentspace.domain.recommendation.dto.ListingSummaryDto;

import java.util.List;

public interface RecommendationService {

    // "Phòng tương tự" — public, không cần userId
    List<ListingSummaryDto> getSimilarListings(Long listingId, int limit);

    // "Gợi ý cho bạn" — personalized, cần userId
    List<ListingSummaryDto> getForYou(Long userId, int limit);

    // "Tin đăng nổi bật" — fallback cho anonymous user
    List<ListingSummaryDto> getTrending(int limit);
}
