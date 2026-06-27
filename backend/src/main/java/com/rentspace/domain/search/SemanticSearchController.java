package com.rentspace.domain.search;

import com.rentspace.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/search")
@RequiredArgsConstructor
@Tag(name = "Semantic Search API", description = "Tìm kiếm phòng bằng ngôn ngữ tự nhiên tiếng Việt")
public class SemanticSearchController {

    private final SemanticSearchService semanticSearchService;
    private final AssistantSearchService assistantSearchService;

    /**
     * POST /api/v1/search/semantic
     * Auth: optional — anonymous user cũng dùng được
     */
    @PostMapping("/semantic")
    @Operation(summary = "Tìm kiếm phòng bằng câu mô tả tiếng Việt tự nhiên")
    public ResponseEntity<ApiResponse<SemanticSearchResponse>> semanticSearch(
            @Valid @RequestBody SemanticSearchRequest request,
            HttpServletRequest httpRequest
    ) {
        String clientIp = getClientIp(httpRequest);
        SemanticSearchResponse result = semanticSearchService.search(request, clientIp);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * POST /api/v1/search/assistant
     * Trợ lý AI tư vấn tìm phòng — trả về message tự nhiên + kết quả tìm kiếm.
     * Auth: optional — anonymous user cũng dùng được
     */
    @PostMapping("/assistant")
    @Operation(summary = "Trợ lý AI tư vấn tìm phòng bằng hội thoại tự nhiên")
    public ResponseEntity<ApiResponse<AssistantSearchResponse>> assistantSearch(
            @Valid @RequestBody SemanticSearchRequest request,
            HttpServletRequest httpRequest
    ) {
        String clientIp = getClientIp(httpRequest);
        AssistantSearchResponse result = assistantSearchService.chat(request, clientIp);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        return (forwarded != null && !forwarded.isBlank())
                ? forwarded.split(",")[0].trim()
                : request.getRemoteAddr();
    }
}
