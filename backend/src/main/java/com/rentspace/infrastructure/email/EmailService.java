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
        log.info("Đã gửi OTP đến: {}. Mã OTP là: {}", toEmail, otp);
        try {
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("Không thể gửi email thực tế do chưa cấu hình SMTP. (Bỏ qua lỗi này ở môi trường dev)");
        }
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
        try {
            mailSender.send(message);
            log.info("Đã gửi email chào mừng đến: {}", toEmail);
        } catch (Exception e) {
            log.warn("Không thể gửi email chào mừng thực tế do chưa cấu hình SMTP. (Bỏ qua lỗi này ở môi trường dev)");
        }
    }

    @Async
    public void sendKycResultEmail(String toEmail, String fullName, boolean approved, String rejectReason) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        if (approved) {
            message.setSubject("[RentSpace] Hồ sơ KYC của bạn đã được phê duyệt thành công!");
            message.setText(String.format(
                    "Xin chào %s,\n\nHồ sơ xác thực danh tính (KYC) của bạn trên RentSpace đã được phê duyệt thành công.\n\nBây giờ bạn đã có đầy đủ quyền đăng tin cho thuê phòng trên hệ thống của chúng tôi.\n\nTrân trọng,\nĐội ngũ RentSpace",
                    fullName
            ));
        } else {
            message.setSubject("[RentSpace] Hồ sơ KYC của bạn đã bị từ chối");
            message.setText(String.format(
                    "Xin chào %s,\n\nHồ sơ xác thực danh tính (KYC) của bạn trên RentSpace không được chấp nhận.\n\nLý do từ chối: %s\n\nVui lòng kiểm tra lại thông tin và nộp lại hồ sơ tại trang cá nhân.\n\nTrân trọng,\nĐội ngũ RentSpace",
                    fullName,
                    rejectReason
            ));
        }
        try {
            mailSender.send(message);
            log.info("Đã gửi email kết quả KYC đến: {} (approved={})", toEmail, approved);
        } catch (Exception e) {
            log.warn("Không thể gửi email kết quả KYC thực tế do chưa cấu hình SMTP. (Bỏ qua lỗi này ở môi trường dev)");
        }
    }
}
