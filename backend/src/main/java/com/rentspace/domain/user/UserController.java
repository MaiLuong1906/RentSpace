package com.rentspace.domain.user;

import com.rentspace.common.response.ApiResponse;
import com.rentspace.domain.user.dto.PublicProfileResponse;
import com.rentspace.domain.user.dto.UpdateProfileRequest;
import com.rentspace.domain.user.dto.UserProfileResponse;
import java.util.List;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "User", description = "Quản lý thông tin người dùng")
public class UserController {

    private final UserService userService;

    // ===== GET /api/v1/users/me =====
    @GetMapping("/me")
    @Operation(summary = "Lấy thông tin hồ sơ của chính mình")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getMyProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        UserProfileResponse profile = userService.getProfileByEmail(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    // ===== PUT /api/v1/users/me =====
    @PutMapping("/me")
    @Operation(summary = "Cập nhật hồ sơ cá nhân (tên, số điện thoại)")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateMyProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserProfileResponse profile = userService.updateProfile(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    // ===== PATCH /api/v1/users/me/avatar =====
    @PatchMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload / Thay đổi ảnh đại diện (avatar)")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateAvatar(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file) {
        UserProfileResponse profile = userService.updateAvatar(userDetails.getUsername(), file);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    // ===== GET /api/v1/users/{id} =====
    @GetMapping("/{userId}")
    @Operation(summary = "Xem hồ sơ công khai của người dùng khác")
    public ResponseEntity<ApiResponse<PublicProfileResponse>> getPublicProfile(@PathVariable Long userId) {
        PublicProfileResponse profile = userService.getPublicProfile(userId);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    // ===== GET /api/v1/users/all (Dev only) =====
    @GetMapping("/all")
    @Operation(summary = "[Dev] Lấy danh sách tất cả người dùng")
    public ResponseEntity<ApiResponse<List<UserProfileResponse>>> getAllUsers() {
        List<UserProfileResponse> profiles = userService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.success(profiles));
    }
}
