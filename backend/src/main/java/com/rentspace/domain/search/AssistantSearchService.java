package com.rentspace.domain.search;

public interface AssistantSearchService {
    AssistantSearchResponse chat(SemanticSearchRequest request, String clientIp);
}
