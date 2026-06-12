package com.rentspace.domain.roommate;

import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.common.response.ApiResponse;
import com.rentspace.domain.roommate.dto.RoommateMatchResponse;
import com.rentspace.domain.roommate.dto.RoommateProfileRequest;
import com.rentspace.domain.roommate.dto.RoommateProfileResponse;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/v1/roommates")
@RequiredArgsConstructor
@Tag(name = "Roommate Matching", description = "Các API tìm bạn ở ghép (quản lý hồ sơ, lấy gợi ý, từ chối gợi ý)")
@SecurityRequirement(name = "bearerAuth")
public class RoommateController {

    private final RoommateService roommateService;
    private final UserRepository userRepository;

    @GetMapping("/profile")
    @Operation(summary = "Lấy hồ sơ tìm bạn ở ghép của người dùng hiện tại")
    public ResponseEntity<ApiResponse<RoommateProfileResponse>> getProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = getAuthenticatedUser(userDetails);
        RoommateProfileResponse response = roommateService.getProfile(currentUser);
        return ResponseEntity.ok(ApiResponse.success("Lấy hồ sơ thành công", response));
    }

    @PutMapping("/profile")
    @Operation(summary = "Tạo mới hoặc cập nhật hồ sơ tìm bạn ở ghép")
    public ResponseEntity<ApiResponse<RoommateProfileResponse>> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody RoommateProfileRequest request) {
        User currentUser = getAuthenticatedUser(userDetails);
        RoommateProfileResponse response = roommateService.updateProfile(request, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật hồ sơ thành công", response));
    }

    @GetMapping("/suggestions")
    @Operation(summary = "Lấy danh sách tối đa 10 gợi ý bạn ở ghép phù hợp nhất")
    public ResponseEntity<ApiResponse<List<RoommateMatchResponse>>> getSuggestions(
            @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = getAuthenticatedUser(userDetails);
        List<RoommateMatchResponse> response = roommateService.getSuggestions(currentUser);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách gợi ý thành công", response));
    }

    @PatchMapping("/matches/{matchId}/dismiss")
    @Operation(summary = "Từ chối gợi ý bạn ở ghép (không hiển thị lại nữa)")
    public ResponseEntity<ApiResponse<Void>> dismissMatch(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long matchId) {
        User currentUser = getAuthenticatedUser(userDetails);
        roommateService.dismissMatch(matchId, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Đã từ chối gợi ý thành công", null));
    }

    private User getAuthenticatedUser(UserDetails userDetails) {
        if (userDetails == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Bạn cần đăng nhập để thực hiện thao tác này");
        }
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản"));
    }
}
