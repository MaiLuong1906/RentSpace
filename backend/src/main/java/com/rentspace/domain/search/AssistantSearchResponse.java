package com.rentspace.domain.search;

import com.rentspace.domain.listing.dto.ListingResponse;
import java.util.List;

public record AssistantSearchResponse(
        String message,                    // Tin nhắn tư vấn tự nhiên từ AI
        ExtractedSearchParams extractedParams,  // Params đã extract (null nếu AI chưa đủ thông tin)
        List<ListingResponse> listings,
        long totalElements,
        boolean usedFallback
) {}
