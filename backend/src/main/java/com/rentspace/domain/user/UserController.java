package com.rentspace.domain.user;

import com.rentspace.common.response.ApiResponse;
import com.rentspace.domain.user.dto.UserProfileResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "User", description = "Quản lý thông tin người dùng")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    @Operation(summary = "Lấy thông tin profile của người dùng hiện tại")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getMyProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        UserProfileResponse profile = userService.getProfileByEmail(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @GetMapping("/{userId}")
    @Operation(summary = "Lấy thông tin profile công khai của người dùng")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getUserProfile(@PathVariable Long userId) {
        UserProfileResponse profile = userService.getProfile(userId);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }
}
