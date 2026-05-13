package com.rentspace.domain.auth;

import com.rentspace.common.exception.BusinessException;
import com.rentspace.domain.auth.dto.RegisterRequest;
import com.rentspace.domain.auth.dto.VerifyOtpRequest;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import com.rentspace.domain.user.enums.Role;
import com.rentspace.infrastructure.email.EmailService;
import com.rentspace.infrastructure.redis.OtpService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;
    private final EmailService emailService;
    private final AuthenticationManager authenticationManager;
    private final com.rentspace.infrastructure.security.JwtTokenProvider jwtTokenProvider;
    private final StringRedisTemplate redisTemplate;

    @Transactional
    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Email đã được sử dụng: " + request.getEmail());
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .role(Role.valueOf(request.getRole().toUpperCase()))
                .isActive(false) // Phải xác thực email
                .build();

        userRepository.save(user);

        // Tạo OTP và gửi email
        String otp = otpService.generateAndSaveOtp(user.getEmail());
        emailService.sendOtpEmail(user.getEmail(), otp);
        
        log.info("Đăng ký thành công, chờ xác minh: email={}", user.getEmail());
    }

    @Transactional
    public void verifyOtp(VerifyOtpRequest request) {
        if (!otpService.validateOtp(request.getEmail(), request.getOtp())) {
            throw new BusinessException("Mã OTP không hợp lệ hoặc đã hết hạn");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BusinessException("Không tìm thấy người dùng với email: " + request.getEmail()));

        if (user.getIsActive() && user.getIsEmailVerified()) {
            throw new BusinessException("Tài khoản này đã được xác thực trước đó.");
        }

        user.setIsActive(true);
        user.setIsEmailVerified(true);
        userRepository.save(user);

        otpService.clearOtp(request.getEmail());

        emailService.sendWelcomeEmail(user.getEmail(), user.getFullName());

        log.info("Xác thực email thành công: email={}", user.getEmail());
    }

    @Transactional
    public void resendOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("Không tìm thấy người dùng với email: " + email));

        if (user.getIsActive() && user.getIsEmailVerified()) {
            throw new BusinessException("Tài khoản này đã được xác thực trước đó.");
        }

        String otp = otpService.generateAndSaveOtp(email);
        emailService.sendOtpEmail(email, otp);

        log.info("Đã gửi lại mã OTP cho email: {}", email);
    }

    public com.rentspace.domain.auth.dto.AuthResponse login(com.rentspace.domain.auth.dto.LoginRequest request) {
        // 1. Xác thực mật khẩu
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        // 2. Lấy thông tin user
        com.rentspace.domain.user.CustomUserDetails userDetails = (com.rentspace.domain.user.CustomUserDetails) authentication.getPrincipal();
        User user = userDetails.getUser();

        // 3. Kiểm tra trạng thái kích hoạt
        if (!user.getIsActive() || !user.getIsEmailVerified()) {
            throw new BusinessException("Tài khoản chưa được xác thực email. Vui lòng kiểm tra email của bạn.");
        }

        // 4. Sinh Token
        String accessToken = jwtTokenProvider.generateAccessToken(userDetails);
        String refreshToken = jwtTokenProvider.generateRefreshToken(userDetails);

        // 5. Lưu Refresh Token vào Redis (7 ngày)
        redisTemplate.opsForValue().set(
                "RT:" + user.getEmail(),
                refreshToken,
                7,
                TimeUnit.DAYS
        );

        log.info("Đăng nhập thành công: email={}", user.getEmail());

        // 6. Trả về Response
        return com.rentspace.domain.auth.dto.AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(com.rentspace.domain.auth.dto.AuthResponse.UserSummary.from(user))
                .build();
    }

    public com.rentspace.domain.auth.dto.AuthResponse refreshToken(com.rentspace.domain.auth.dto.RefreshTokenRequest request) {
        try {
            // 1. Lấy email từ token (Sẽ quăng lỗi nếu token hết hạn hoặc sai chữ ký)
            String email = jwtTokenProvider.extractUsername(request.getRefreshToken());

            // 2. Kiểm tra Redis xem token còn hợp lệ / khớp không
            String savedRefreshToken = redisTemplate.opsForValue().get("RT:" + email);
            if (savedRefreshToken == null || !savedRefreshToken.equals(request.getRefreshToken())) {
                throw new BusinessException("Refresh Token không hợp lệ hoặc đã bị thu hồi. Vui lòng đăng nhập lại.");
            }

            // 3. Lấy thông tin User
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new BusinessException("Không tìm thấy người dùng"));

            com.rentspace.domain.user.CustomUserDetails userDetails = new com.rentspace.domain.user.CustomUserDetails(user);

            // 4. Sinh cặp Token mới (Refresh Token Rotation)
            String newAccessToken = jwtTokenProvider.generateAccessToken(userDetails);
            String newRefreshToken = jwtTokenProvider.generateRefreshToken(userDetails);

            // 5. Cập nhật lại Redis với Refresh Token mới
            redisTemplate.opsForValue().set(
                    "RT:" + email,
                    newRefreshToken,
                    7,
                    TimeUnit.DAYS
            );

            log.info("Làm mới token thành công: email={}", email);

            // 6. Trả về Response
            return com.rentspace.domain.auth.dto.AuthResponse.builder()
                    .accessToken(newAccessToken)
                    .refreshToken(newRefreshToken)
                    .user(com.rentspace.domain.auth.dto.AuthResponse.UserSummary.from(user))
                    .build();

        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            throw new BusinessException("Refresh Token đã hết hạn. Vui lòng đăng nhập lại.");
        } catch (io.jsonwebtoken.JwtException | IllegalArgumentException e) {
            throw new BusinessException("Refresh Token không hợp lệ. Vui lòng đăng nhập lại.");
        }
    }

    @Transactional
    public void forgotPassword(com.rentspace.domain.auth.dto.ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BusinessException("Không tìm thấy tài khoản với email này."));

        if (!user.getIsActive()) {
            throw new BusinessException("Tài khoản chưa được kích hoạt. Vui lòng xác thực email trước.");
        }

        String otp = otpService.generateAndSaveOtp(user.getEmail());
        emailService.sendOtpEmail(user.getEmail(), otp);

        log.info("Đã gửi OTP khôi phục mật khẩu cho email: {}", user.getEmail());
    }

    @Transactional
    public void resetPassword(com.rentspace.domain.auth.dto.ResetPasswordRequest request) {
        if (!otpService.validateOtp(request.getEmail(), request.getOtp())) {
            throw new BusinessException("Mã OTP không hợp lệ hoặc đã hết hạn.");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BusinessException("Không tìm thấy tài khoản với email này."));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        otpService.clearOtp(request.getEmail());

        // Hủy toàn bộ session cũ (Xóa Refresh Token trong Redis)
        redisTemplate.delete("RT:" + user.getEmail());

        log.info("Đổi mật khẩu thành công cho email: {}", user.getEmail());
    }

    @Transactional
    public void changePassword(String email, com.rentspace.domain.auth.dto.ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("Không tìm thấy tài khoản."));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new BusinessException("Mật khẩu hiện tại không chính xác.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Hủy toàn bộ session cũ (tùy chọn, bắt user đăng nhập lại)
        redisTemplate.delete("RT:" + user.getEmail());

        log.info("Người dùng chủ động đổi mật khẩu thành công: email={}", user.getEmail());
    }
}
