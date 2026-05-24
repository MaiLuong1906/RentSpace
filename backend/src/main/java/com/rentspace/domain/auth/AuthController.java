package com.rentspace.domain.auth;

import com.rentspace.common.response.ApiResponse;
import com.rentspace.domain.auth.dto.RegisterRequest;
import com.rentspace.domain.auth.dto.LoginRequest;
import com.rentspace.domain.auth.dto.GoogleLoginRequest;
import com.rentspace.domain.auth.dto.AuthResponse;
import com.rentspace.domain.auth.dto.RefreshTokenRequest;
import com.rentspace.domain.auth.dto.ForgotPasswordRequest;
import com.rentspace.domain.auth.dto.ResetPasswordRequest;
import com.rentspace.domain.auth.dto.ChangePasswordRequest;
import com.rentspace.domain.auth.dto.RegisterResponse;
import com.rentspace.domain.auth.dto.ResendOtpRequest;
import com.rentspace.domain.auth.dto.VerifyOtpRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<AuthResponse>> googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
        AuthResponse response = authService.googleLogin(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Mã OTP khôi phục đã được gửi vào email của bạn."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới."));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<String>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {
        
        // Vì /api/v1/auth/** đang được cấu hình là public (ai cũng gọi được)
        // Nên ta phải tự check xem user đã gửi Access Token chưa
        if (userDetails == null) {
            return org.springframework.http.ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Vui lòng đăng nhập để sử dụng tính năng này."));
        }
        
        authService.changePassword(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Chủ động đổi mật khẩu thành công. Vui lòng đăng nhập lại trên các thiết bị."));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<RegisterResponse>> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        RegisterResponse response = new RegisterResponse("Vui lòng kiểm tra email để xác minh tài khoản");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<String>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        authService.verifyOtp(request);
        return ResponseEntity.ok(ApiResponse.success("Xác thực tài khoản thành công. Bạn đã có thể đăng nhập."));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<ApiResponse<String>> resendOtp(@Valid @RequestBody ResendOtpRequest request) {
        authService.resendOtp(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Mã OTP mới đã được gửi vào email của bạn."));
    }
}
