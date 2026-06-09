package com.rentspace.domain.auth;

import com.rentspace.common.exception.BusinessException;
import com.rentspace.domain.auth.dto.*;
import com.rentspace.domain.user.CustomUserDetails;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import com.rentspace.domain.user.enums.KycStatus;
import com.rentspace.domain.user.enums.Role;
import com.rentspace.infrastructure.email.EmailService;
import com.rentspace.infrastructure.redis.OtpService;
import com.rentspace.infrastructure.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests cho AuthService — module xác thực lõi của hệ thống.
 * Tập trung test các luồng quan trọng nhất: register, login, verifyOtp, refreshToken, logout.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private OtpService otpService;

    @Mock
    private EmailService emailService;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private AuthService authService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .email("test@rentspace.com")
                .password("$2a$12$hashedPassword")
                .fullName("Nguyen Van A")
                .phoneNumber("0912345678")
                .role(Role.TENANT)
                .kycStatus(KycStatus.PENDING)
                .isActive(true)
                .isEmailVerified(true)
                .build();
    }

    // =========================================================================
    // REGISTER
    // =========================================================================
    @Nested
    @DisplayName("POST /auth/register")
    class RegisterTests {

        private RegisterRequest createValidRequest() {
            RegisterRequest request = new RegisterRequest();
            request.setEmail("newuser@rentspace.com");
            request.setPassword("StrongPass1");
            request.setFullName("Nguyen Van B");
            request.setPhoneNumber("0987654321");
            request.setRole("TENANT");
            return request;
        }

        @Test
        @DisplayName("Đăng ký thành công — user được lưu, password được hash, OTP được gửi")
        void register_withValidData_shouldSaveUserAndSendOtp() {
            // Given
            RegisterRequest request = createValidRequest();
            when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
            when(passwordEncoder.encode(request.getPassword())).thenReturn("$2a$12$encodedPassword");
            when(otpService.generateAndSaveOtp(request.getEmail())).thenReturn("123456");

            // When
            authService.register(request);

            // Then — Xác nhận user được lưu đúng thông tin
            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());
            User savedUser = userCaptor.getValue();

            assertEquals("newuser@rentspace.com", savedUser.getEmail());
            assertEquals("$2a$12$encodedPassword", savedUser.getPassword());
            assertEquals("Nguyen Van B", savedUser.getFullName());
            assertEquals(Role.TENANT, savedUser.getRole());
            assertFalse(savedUser.getIsActive()); // Phải inactive cho đến khi verify email

            // Then — Xác nhận OTP được tạo và email được gửi
            verify(otpService).generateAndSaveOtp("newuser@rentspace.com");
            verify(emailService).sendOtpEmail("newuser@rentspace.com", "123456");
        }

        @Test
        @DisplayName("Đăng ký với email đã tồn tại — ném BusinessException")
        void register_withDuplicateEmail_shouldThrowException() {
            // Given
            RegisterRequest request = createValidRequest();
            when(userRepository.existsByEmail(request.getEmail())).thenReturn(true);

            // When & Then
            BusinessException exception = assertThrows(BusinessException.class,
                    () -> authService.register(request));

            assertTrue(exception.getMessage().contains("Email đã được sử dụng"));
            verify(userRepository, never()).save(any(User.class));
            verify(otpService, never()).generateAndSaveOtp(anyString());
        }

        @Test
        @DisplayName("Đăng ký với role LANDLORD — user có đúng role")
        void register_withLandlordRole_shouldSetCorrectRole() {
            // Given
            RegisterRequest request = createValidRequest();
            request.setRole("LANDLORD");
            when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
            when(passwordEncoder.encode(anyString())).thenReturn("hashed");
            when(otpService.generateAndSaveOtp(anyString())).thenReturn("123456");

            // When
            authService.register(request);

            // Then
            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());
            assertEquals(Role.LANDLORD, userCaptor.getValue().getRole());
        }
    }

    // =========================================================================
    // LOGIN
    // =========================================================================
    @Nested
    @DisplayName("POST /auth/login")
    class LoginTests {

        @Test
        @DisplayName("Đăng nhập thành công — trả về JWT access + refresh token")
        void login_withValidCredentials_shouldReturnTokens() {
            // Given
            LoginRequest request = new LoginRequest();
            request.setEmail("test@rentspace.com");
            request.setPassword("StrongPass1");

            CustomUserDetails userDetails = new CustomUserDetails(testUser);
            Authentication authentication = mock(Authentication.class);

            when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                    .thenReturn(authentication);
            when(authentication.getPrincipal()).thenReturn(userDetails);
            when(jwtTokenProvider.generateAccessToken(userDetails)).thenReturn("access-jwt-token");
            when(jwtTokenProvider.generateRefreshToken(userDetails)).thenReturn("refresh-jwt-token");
            when(redisTemplate.opsForValue()).thenReturn(valueOperations);

            // When
            AuthResponse response = authService.login(request);

            // Then
            assertNotNull(response);
            assertEquals("access-jwt-token", response.getAccessToken());
            assertEquals("refresh-jwt-token", response.getRefreshToken());
            assertEquals("test@rentspace.com", response.getUser().getEmail());
            assertEquals("Nguyen Van A", response.getUser().getFullName());
            assertEquals("TENANT", response.getUser().getRole());

            // Xác nhận Refresh Token được lưu vào Redis với TTL 7 ngày
            verify(valueOperations).set(
                    eq("RT:test@rentspace.com"),
                    eq("refresh-jwt-token"),
                    eq(7L),
                    eq(TimeUnit.DAYS)
            );
        }

        @Test
        @DisplayName("Đăng nhập sai mật khẩu — Spring Security ném BadCredentialsException")
        void login_withWrongPassword_shouldThrowBadCredentials() {
            // Given
            LoginRequest request = new LoginRequest();
            request.setEmail("test@rentspace.com");
            request.setPassword("wrongPassword");

            when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                    .thenThrow(new BadCredentialsException("Bad credentials"));

            // When & Then
            assertThrows(BadCredentialsException.class,
                    () -> authService.login(request));
        }

        @Test
        @DisplayName("Đăng nhập với email chưa verify — ném BusinessException")
        void login_withUnverifiedEmail_shouldThrowException() {
            // Given
            User unverifiedUser = User.builder()
                    .id(2L)
                    .email("unverified@rentspace.com")
                    .password("hashed")
                    .fullName("User B")
                    .role(Role.TENANT)
                    .isActive(false)
                    .isEmailVerified(false)
                    .build();

            LoginRequest request = new LoginRequest();
            request.setEmail("unverified@rentspace.com");
            request.setPassword("StrongPass1");

            CustomUserDetails userDetails = new CustomUserDetails(unverifiedUser);
            Authentication authentication = mock(Authentication.class);

            when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                    .thenReturn(authentication);
            when(authentication.getPrincipal()).thenReturn(userDetails);

            // When & Then
            BusinessException exception = assertThrows(BusinessException.class,
                    () -> authService.login(request));

            assertTrue(exception.getMessage().contains("chưa được xác thực email"));
            verify(jwtTokenProvider, never()).generateAccessToken(any());
        }
    }

    // =========================================================================
    // VERIFY OTP
    // =========================================================================
    @Nested
    @DisplayName("POST /auth/verify-otp")
    class VerifyOtpTests {

        @Test
        @DisplayName("OTP hợp lệ — kích hoạt tài khoản, gửi email chào mừng")
        void verifyOtp_withValidOtp_shouldActivateAccount() {
            // Given
            User inactiveUser = User.builder()
                    .id(3L)
                    .email("new@rentspace.com")
                    .password("hashed")
                    .fullName("User C")
                    .role(Role.TENANT)
                    .isActive(false)
                    .isEmailVerified(false)
                    .build();

            VerifyOtpRequest request = new VerifyOtpRequest();
            request.setEmail("new@rentspace.com");
            request.setOtp("123456");

            when(otpService.validateOtp("new@rentspace.com", "123456")).thenReturn(true);
            when(userRepository.findByEmail("new@rentspace.com")).thenReturn(Optional.of(inactiveUser));

            // When
            authService.verifyOtp(request);

            // Then — Xác nhận user được kích hoạt
            assertTrue(inactiveUser.getIsActive());
            assertTrue(inactiveUser.getIsEmailVerified());
            verify(userRepository).save(inactiveUser);

            // Then — OTP được xóa sau khi dùng (one-time use)
            verify(otpService).clearOtp("new@rentspace.com");

            // Then — Gửi email chào mừng
            verify(emailService).sendWelcomeEmail("new@rentspace.com", "User C");
        }

        @Test
        @DisplayName("OTP sai hoặc hết hạn — ném BusinessException")
        void verifyOtp_withInvalidOtp_shouldThrowException() {
            // Given
            VerifyOtpRequest request = new VerifyOtpRequest();
            request.setEmail("test@rentspace.com");
            request.setOtp("999999");

            when(otpService.validateOtp("test@rentspace.com", "999999")).thenReturn(false);

            // When & Then
            BusinessException exception = assertThrows(BusinessException.class,
                    () -> authService.verifyOtp(request));

            assertTrue(exception.getMessage().contains("OTP không hợp lệ"));
            verify(userRepository, never()).save(any());
        }
    }

    // =========================================================================
    // REFRESH TOKEN
    // =========================================================================
    @Nested
    @DisplayName("POST /auth/refresh")
    class RefreshTokenTests {

        @Test
        @DisplayName("Refresh token hợp lệ — trả về cặp token mới (Token Rotation)")
        void refreshToken_withValidToken_shouldReturnNewTokenPair() {
            // Given
            RefreshTokenRequest request = new RefreshTokenRequest();
            request.setRefreshToken("valid-refresh-token");

            when(jwtTokenProvider.extractUsername("valid-refresh-token")).thenReturn("test@rentspace.com");
            when(redisTemplate.opsForValue()).thenReturn(valueOperations);
            when(valueOperations.get("RT:test@rentspace.com")).thenReturn("valid-refresh-token");
            when(userRepository.findByEmail("test@rentspace.com")).thenReturn(Optional.of(testUser));
            when(jwtTokenProvider.generateAccessToken(any(CustomUserDetails.class))).thenReturn("new-access-token");
            when(jwtTokenProvider.generateRefreshToken(any(CustomUserDetails.class))).thenReturn("new-refresh-token");

            // When
            AuthResponse response = authService.refreshToken(request);

            // Then
            assertEquals("new-access-token", response.getAccessToken());
            assertEquals("new-refresh-token", response.getRefreshToken());

            // Xác nhận Refresh Token mới được lưu lại Redis (Token Rotation)
            verify(valueOperations).set(
                    eq("RT:test@rentspace.com"),
                    eq("new-refresh-token"),
                    eq(7L),
                    eq(TimeUnit.DAYS)
            );
        }

        @Test
        @DisplayName("Refresh token đã bị thu hồi (không khớp Redis) — ném BusinessException")
        void refreshToken_whenRevoked_shouldThrowException() {
            // Given
            RefreshTokenRequest request = new RefreshTokenRequest();
            request.setRefreshToken("stolen-refresh-token");

            when(jwtTokenProvider.extractUsername("stolen-refresh-token")).thenReturn("test@rentspace.com");
            when(redisTemplate.opsForValue()).thenReturn(valueOperations);
            when(valueOperations.get("RT:test@rentspace.com")).thenReturn("different-token-in-redis");

            // When & Then
            BusinessException exception = assertThrows(BusinessException.class,
                    () -> authService.refreshToken(request));

            assertTrue(exception.getMessage().contains("không hợp lệ"));
            verify(jwtTokenProvider, never()).generateAccessToken(any());
        }
    }

    // =========================================================================
    // LOGOUT
    // =========================================================================
    @Nested
    @DisplayName("POST /auth/logout")
    class LogoutTests {

        @Test
        @DisplayName("Đăng xuất — xóa Refresh Token khỏi Redis")
        void logout_shouldDeleteRefreshTokenFromRedis() {
            // When
            authService.logout("test@rentspace.com");

            // Then
            verify(redisTemplate).delete("RT:test@rentspace.com");
        }
    }
}
