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

    @Async
    public void sendKycPendingEmail(String toEmail, String fullName) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("[RentSpace] Hồ sơ eKYC của bạn đang được xem xét");
        message.setText(String.format(
                "Xin chào %s,\n\nHệ thống eKYC nhận thấy thông tin hình ảnh của bạn cần được đối chiếu thêm. Hồ sơ đã được chuyển sang chế độ duyệt thủ công bởi Ban quản trị.\n\nKết quả phê duyệt sẽ được cập nhật trong vòng 1-2 ngày làm việc.\n\nTrân trọng,\nĐội ngũ RentSpace",
                fullName
        ));
        try {
            mailSender.send(message);
            log.info("Đã gửi email chờ duyệt KYC đến: {}", toEmail);
        } catch (Exception e) {
            log.warn("Không thể gửi email chờ duyệt KYC thực tế do chưa cấu hình SMTP. (Bỏ qua lỗi này ở môi trường dev)");
        }
    }

    @Async
    public void sendDepositCreatedEmail(String toEmail, String fullName, String listingTitle, Long amount) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("[RentSpace] Yêu cầu đặt cọc mới");
        message.setText(String.format(
                "Xin chào %s,\n\nYêu cầu đặt cọc cho phòng \"%s\" đã được tạo thành công trên RentSpace.\n\nSố tiền đặt cọc: %,d VND.\n\nVui lòng hoàn tất thanh toán trong vòng 15 phút để đảm bảo giao dịch.\n\nTrân trọng,\nĐội ngũ RentSpace",
                fullName,
                listingTitle,
                amount
        ));
        try {
            mailSender.send(message);
            log.info("Đã gửi email yêu cầu đặt cọc thành công đến: {}", toEmail);
        } catch (Exception e) {
            log.warn("Không thể gửi email yêu cầu đặt cọc thực tế do chưa cấu hình SMTP. (Bỏ qua lỗi này ở môi trường dev)");
        }
    }

    @Async
    public void sendDepositPaidEmail(String toEmail, String fullName, String listingTitle, Long amount, boolean isLandlord) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        if (isLandlord) {
            message.setSubject("[RentSpace] Đã nhận tiền đặt cọc giữ chỗ");
            message.setText(String.format(
                    "Xin chào %s,\n\nNgười thuê đã hoàn tất thanh toán đặt cọc cho phòng \"%s\" của bạn với số tiền %,d VND.\n\nTiền cọc hiện đang được giữ an toàn trên nền tảng RentSpace (Escrow) cho đến khi người thuê nhận phòng.\n\nTrân trọng,\nĐội ngũ RentSpace",
                    fullName,
                    listingTitle,
                    amount
            ));
        } else {
            message.setSubject("[RentSpace] Thanh toán đặt cọc thành công");
            message.setText(String.format(
                    "Xin chào %s,\n\nBạn đã thanh toán đặt cọc thành công cho phòng \"%s\" với số tiền %,d VND.\n\nTiền cọc đang được giữ an toàn trên hệ thống (Escrow). Trạng thái hiện tại: ESCROW_HOLDING (PAID).\n\nTrân trọng,\nĐội ngũ RentSpace",
                    fullName,
                    listingTitle,
                    amount
            ));
        }
        try {
            mailSender.send(message);
            log.info("Đã gửi email xác nhận thanh toán đặt cọc thành công đến: {}", toEmail);
        } catch (Exception e) {
            log.warn("Không thể gửi email xác nhận thanh toán đặt cọc thực tế do chưa cấu hình SMTP. (Bỏ qua lỗi này ở môi trường dev)");
        }
    }
}
