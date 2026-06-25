package com.rentspace.domain.notification.email;

import com.rentspace.domain.notification.email.dto.DepositEmailDto;
import com.rentspace.domain.notification.email.dto.DisputeEmailDto;
import com.rentspace.domain.notification.email.dto.SubscriptionEmailDto;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private static final String SENDER_NAME = "RentSpace";
    private static final String ENCODING = "UTF-8";

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Override
    @Async
    public void sendDepositRequestedEmail(String toEmail, DepositEmailDto data) {
        Context ctx = new Context();
        ctx.setVariable("recipientName", data.getRecipientName());
        ctx.setVariable("listingTitle", data.getListingTitle());
        ctx.setVariable("listingAddress", data.getListingAddress());
        ctx.setVariable("depositAmount", data.getDepositAmount());
        ctx.setVariable("counterpartName", data.getCounterpartName());
        ctx.setVariable("depositDetailUrl", data.getDepositDetailUrl());

        send(toEmail, "[RentSpace] Yêu cầu đặt cọc mới", "email/deposit-requested", ctx);
    }

    @Override
    @Async
    public void sendDepositMatchedEmail(String toEmail, DepositEmailDto data) {
        Context ctx = new Context();
        ctx.setVariable("recipientName", data.getRecipientName());
        ctx.setVariable("listingTitle", data.getListingTitle());
        ctx.setVariable("listingAddress", data.getListingAddress());
        ctx.setVariable("depositAmount", data.getDepositAmount());
        ctx.setVariable("counterpartName", data.getCounterpartName());
        ctx.setVariable("depositDetailUrl", data.getDepositDetailUrl());

        send(toEmail, "[RentSpace] Đặt cọc đã được xác nhận", "email/deposit-matched", ctx);
    }

    @Override
    @Async
    public void sendDisputeAlertEmail(String toEmail, DisputeEmailDto data) {
        Context ctx = new Context();
        ctx.setVariable("recipientName", data.getRecipientName());
        ctx.setVariable("listingTitle", data.getListingTitle());
        ctx.setVariable("disputeReason", data.getDisputeReason());
        ctx.setVariable("submittedByName", data.getSubmittedByName());
        ctx.setVariable("disputeDetailUrl", data.getDisputeDetailUrl());

        send(toEmail, "[RentSpace] Cảnh báo: Có tranh chấp mới", "email/dispute-alert", ctx);
    }

    @Override
    @Async
    public void sendSubscriptionExpiryWarningEmail(String toEmail, SubscriptionEmailDto data) {
        Context ctx = new Context();
        ctx.setVariable("recipientName", data.getRecipientName());
        ctx.setVariable("planName", data.getPlanName());
        ctx.setVariable("expiryDate", data.getExpiryDate());
        ctx.setVariable("daysRemaining", data.getDaysRemaining());
        ctx.setVariable("renewUrl", data.getRenewUrl());

        send(toEmail,
                "[RentSpace] Gói " + data.getPlanName() + " sắp hết hạn (" + data.getDaysRemaining() + " ngày)",
                "email/subscription-expiry-warning", ctx);
    }

    @Override
    @Async
    public void sendContractSignedEmail(String toEmail, String recipientName, byte[] pdfBytes) {
        try {
            Context ctx = new Context();
            ctx.setVariable("recipientName", recipientName);
            String htmlBody = templateEngine.process("email/contract-signed", ctx);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, ENCODING);
            helper.setFrom("noreply@rentspace.vn", SENDER_NAME);
            helper.setTo(toEmail);
            helper.setSubject("[RentSpace] Hợp đồng thuê nhà đã được ký đầy đủ");
            helper.setText(htmlBody, true);
            helper.addAttachment("hop-dong-thue-nha.pdf", new ByteArrayResource(pdfBytes), "application/pdf");
            mailSender.send(message);
            log.info("Đã gửi email hợp đồng kèm PDF đến {}", toEmail);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Lỗi khi gửi email hợp đồng đến {}: {}", toEmail, e.getMessage());
        }
    }

    private void send(String toEmail, String subject, String templateName, Context ctx) {
        try {
            String htmlBody = templateEngine.process(templateName, ctx);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, ENCODING);
            helper.setFrom("noreply@rentspace.vn", SENDER_NAME);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Đã gửi email '{}' đến {}", subject, toEmail);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Lỗi khi gửi email đến {}: {}", toEmail, e.getMessage());
        }
    }
}
