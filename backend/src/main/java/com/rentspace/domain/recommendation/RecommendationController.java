package com.rentspace.domain.recommendation;

import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.common.response.ApiResponse;
import com.rentspace.domain.recommendation.dto.ListingSummaryDto;
import com.rentspace.domain.user.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/recommendations")
@RequiredArgsConstructor
@Tag(name = "Recommendations API", description = "Gợi ý phòng trọ — tương tự, cá nhân hoá, nổi bật")
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final UserRepository userRepository;

    @GetMapping("/similar/{listingId}")
    @Operation(summary = "Phòng tương tự — public, không cần đăng nhập")
    public ResponseEntity<ApiResponse<List<ListingSummaryDto>>> getSimilarListings(
            @PathVariable Long listingId,
            @RequestParam(defaultValue = "6") int limit) {

        List<ListingSummaryDto> result = recommendationService.getSimilarListings(listingId, limit);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/for-you")
    @Operation(summary = "Gợi ý cho bạn — cá nhân hoá theo lịch sử, yêu cầu đăng nhập")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<List<ListingSummaryDto>>> getForYou(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "12") int limit) {

        Long userId = resolveUserId(userDetails);
        List<ListingSummaryDto> result = recommendationService.getForYou(userId, limit);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/trending")
    @Operation(summary = "Tin đăng nổi bật — public, fallback cho người chưa đăng nhập")
    public ResponseEntity<ApiResponse<List<ListingSummaryDto>>> getTrending(
            @RequestParam(defaultValue = "12") int limit) {

        List<ListingSummaryDto> result = recommendationService.getTrending(limit);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    private Long resolveUserId(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .map(u -> u.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));
    }
}
