package com.rentspace.domain.notification;

import com.rentspace.domain.notification.email.EmailService;
import com.rentspace.domain.notification.email.dto.DepositEmailDto;
import com.rentspace.domain.notification.email.dto.DisputeEmailDto;
import com.rentspace.domain.notification.email.dto.SubscriptionEmailDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;

@SpringBootTest
@ActiveProfiles("test")
class EmailServiceImplTest {

    @Autowired
    private EmailService emailService;

    @Test
    void sendDepositRequestedEmail_renders_correctly() throws InterruptedException {
        emailService.sendDepositRequestedEmail(
                "tenant1@rentspace.com",
                DepositEmailDto.builder()
                        .recipientName("Nguyễn Văn A")
                        .listingTitle("Phòng trọ cao cấp Quận 1")
                        .listingAddress("123 Nguyễn Huệ, Q.1, TP.HCM")
                        .depositAmount(new BigDecimal("2000000"))
                        .counterpartName("Trần Thị B (Chủ nhà)")
                        .depositDetailUrl("http://localhost:3000/app/deposits/1")
                        .build()
        );
        Thread.sleep(500); // chờ @Async hoàn thành
    }

    @Test
    void sendDepositMatchedEmail_renders_correctly() throws InterruptedException {
        emailService.sendDepositMatchedEmail(
                "landlord1@rentspace.com",
                DepositEmailDto.builder()
                        .recipientName("Trần Thị B")
                        .listingTitle("Phòng trọ cao cấp Quận 1")
                        .listingAddress("123 Nguyễn Huệ, Q.1, TP.HCM")
                        .depositAmount(new BigDecimal("2000000"))
                        .counterpartName("Nguyễn Văn A (Người thuê)")
                        .depositDetailUrl("http://localhost:3000/app/deposits/1")
                        .build()
        );
        Thread.sleep(500);
    }

    @Test
    void sendDisputeAlertEmail_renders_correctly() throws InterruptedException {
        emailService.sendDisputeAlertEmail(
                "landlord1@rentspace.com",
                DisputeEmailDto.builder()
                        .recipientName("Trần Thị B")
                        .listingTitle("Phòng trọ cao cấp Quận 1")
                        .disputeReason("Chủ nhà không trả lại tiền cọc sau khi hết hợp đồng")
                        .submittedByName("Nguyễn Văn A")
                        .disputeDetailUrl("http://localhost:3000/app/deposits/1/dispute")
                        .build()
        );
        Thread.sleep(500);
    }

    @Test
    void sendSubscriptionExpiryWarningEmail_renders_correctly() throws InterruptedException {
        emailService.sendSubscriptionExpiryWarningEmail(
                "landlord1@rentspace.com",
                SubscriptionEmailDto.builder()
                        .recipientName("Trần Thị B")
                        .planName("Pro")
                        .expiryDate(LocalDate.now().plusDays(7))
                        .daysRemaining(7)
                        .renewUrl("http://localhost:3000/pricing")
                        .build()
        );
        Thread.sleep(500);
    }
}
