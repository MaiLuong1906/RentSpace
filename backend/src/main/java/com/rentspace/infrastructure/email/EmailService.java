package com.rentspace.infrastructure.email;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Async
    public void sendOtpEmail(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("[RentSpace] Mã xác thực OTP của bạn");
        message.setText(String.format(
                "Xin chào,\n\nMã OTP của bạn là: %s\n\nMã này có hiệu lực trong 5 phút.\n\nNếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.\n\nTrân trọng,\nĐội ngũ RentSpace",
                otp
        ));
        mailSender.send(message);
        log.info("Đã gửi OTP đến: {}", toEmail);
    }

    @Async
    public void sendWelcomeEmail(String toEmail, String fullName) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("[RentSpace] Chào mừng bạn đến với RentSpace!");
        message.setText(String.format(
                "Xin chào %s,\n\nChào mừng bạn đến với RentSpace — Nền tảng tìm phòng trọ an toàn và minh bạch.\n\nHãy bắt đầu khám phá hàng nghìn phòng trọ chất lượng tại địa chỉ: https://rentspace.vn\n\nTrân trọng,\nĐội ngũ RentSpace",
                fullName
        ));
        mailSender.send(message);
        log.info("Đã gửi email chào mừng đến: {}", toEmail);
    }
}
