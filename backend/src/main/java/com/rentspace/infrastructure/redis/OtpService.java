package com.rentspace.infrastructure.redis;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final StringRedisTemplate redisTemplate;
    private static final String OTP_PREFIX = "otp:";
    private static final long OTP_TTL_MINUTES = 10;
    private final SecureRandom secureRandom = new SecureRandom();

    public String generateAndSaveOtp(String email) {
        int otpValue = 100000 + secureRandom.nextInt(900000);
        String otp = String.valueOf(otpValue);
        redisTemplate.opsForValue().set(
                OTP_PREFIX + email,
                otp,
                OTP_TTL_MINUTES,
                TimeUnit.MINUTES
        );
        return otp;
    }

    public boolean validateOtp(String email, String otp) {
        String savedOtp = redisTemplate.opsForValue().get(OTP_PREFIX + email);
        return otp != null && otp.equals(savedOtp);
    }

    public void clearOtp(String email) {
        redisTemplate.delete(OTP_PREFIX + email);
    }
}
