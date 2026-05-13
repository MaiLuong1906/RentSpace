package com.rentspace.domain.auth;

import com.rentspace.common.response.ApiResponse;
import com.rentspace.domain.auth.dto.RegisterRequest;
import com.rentspace.domain.auth.dto.LoginRequest;
import com.rentspace.domain.auth.dto.AuthResponse;
import com.rentspace.domain.auth.dto.RefreshTokenRequest;
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

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new RegisterResponse("Vui lòng kiểm tra email để xác minh tài khoản"));
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
