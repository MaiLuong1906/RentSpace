package com.rentspace.domain.auth;

import com.rentspace.common.exception.BusinessException;
import com.rentspace.domain.auth.dto.RegisterRequest;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import com.rentspace.domain.user.enums.Role;
import com.rentspace.infrastructure.email.EmailService;
import com.rentspace.infrastructure.redis.OtpService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;
    private final EmailService emailService;

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
}
