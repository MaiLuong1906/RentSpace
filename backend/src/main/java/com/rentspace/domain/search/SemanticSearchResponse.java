package com.rentspace.domain.search;

import com.rentspace.domain.listing.dto.ListingResponse;
import java.util.List;

public record SemanticSearchResponse(
        ExtractedSearchParams extractedParams,
        List<ListingResponse> listings,
        long totalElements,
        boolean usedFallback
) {}
