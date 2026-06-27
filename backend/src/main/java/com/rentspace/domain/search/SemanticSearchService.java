package com.rentspace.domain.search;

public interface SemanticSearchService {
    SemanticSearchResponse search(SemanticSearchRequest request, String clientIp);
}
