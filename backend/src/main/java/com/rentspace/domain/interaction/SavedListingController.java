package com.rentspace.domain.interaction;

import com.rentspace.common.response.ApiResponse;
import com.rentspace.domain.interaction.dto.SaveToggleResponse;
import com.rentspace.domain.listing.dto.ListingResponse;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/saved-listings")
@RequiredArgsConstructor
@Tag(name = "Saved Listings", description = "Wishlist — tin đăng yêu thích")
@SecurityRequirement(name = "bearerAuth")
public class SavedListingController {

    private final SavedListingService savedListingService;
    private final UserRepository userRepository;

    @PostMapping("/{listingId}")
    @Operation(summary = "Toggle save / unsave listing")
    public ResponseEntity<ApiResponse<SaveToggleResponse>> toggleSave(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long listingId) {

        Long userId = resolveUserId(userDetails);
        SaveToggleResponse result = savedListingService.toggleSave(userId, listingId);
        String message = result.isSaved() ? "Đã lưu tin đăng" : "Đã bỏ lưu tin đăng";
        return ResponseEntity.ok(ApiResponse.success(message, result));
    }

    @GetMapping
    @Operation(summary = "Danh sách tin đã lưu (wishlist)")
    public ResponseEntity<ApiResponse<Page<ListingResponse>>> getSavedListings(
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 12, sort = "createdAt") Pageable pageable) {

        Long userId = resolveUserId(userDetails);
        Page<ListingResponse> page = savedListingService.getSavedListings(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/{listingId}/status")
    @Operation(summary = "Kiểm tra listing có đang được lưu không")
    public ResponseEntity<ApiResponse<Boolean>> checkSavedStatus(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long listingId) {

        Long userId = resolveUserId(userDetails);
        boolean saved = savedListingService.isSaved(userId, listingId);
        return ResponseEntity.ok(ApiResponse.success(saved));
    }

    private Long resolveUserId(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .map(User::getId)
                .orElseThrow(() -> new com.rentspace.common.exception.ResourceNotFoundException(
                        "Người dùng không tồn tại"));
    }
}
