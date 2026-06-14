package com.rentspace.domain.subscription;

import com.rentspace.domain.notification.NotificationService;
import com.rentspace.domain.notification.enums.NotificationType;
import com.rentspace.domain.subscription.enums.SubscriptionStatus;
import com.rentspace.infrastructure.email.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class SubscriptionExpiryScheduler {

    private final UserSubscriptionRepository userSubscriptionRepository;
    private final SubscriptionService subscriptionService;
    private final NotificationService notificationService;
    private final EmailService emailService;

    /**
     * Quét và xử lý các gói cước hết hạn hàng ngày lúc 00:00.
     */
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void checkExpiredSubscriptions() {
        LocalDateTime now = LocalDateTime.now();
        log.info("Bắt đầu quét các gói cước hết hạn tại thời điểm: {}", now);

        List<UserSubscription> expiredSubs = userSubscriptionRepository
                .findAllByStatusAndExpiresAtBefore(SubscriptionStatus.ACTIVE, now);

        if (expiredSubs.isEmpty()) {
            log.info("Không có gói cước nào hết hạn.");
            return;
        }

        log.info("Tìm thấy {} gói cước hết hạn cần xử lý.", expiredSubs.size());

        for (UserSubscription sub : expiredSubs) {
            try {
                // 1. Chuyển trạng thái gói cước cũ sang EXPIRED
                sub.setStatus(SubscriptionStatus.EXPIRED);
                userSubscriptionRepository.save(sub);

                // 2. Tự động kích hoạt gói FREE mặc định cho người dùng
                subscriptionService.getOrCreateDefaultFreeSubscription(sub.getUser());

                log.info("Đã chuyển đổi gói cước của User ID: {} sang EXPIRED và fallback về gói FREE.",
                        sub.getUser().getId());

                // 3. Gửi thông báo hệ thống qua WebSocket
                String title = "Gói hội viên đã hết hạn";
                String content = String.format(
                        "Gói hội viên %s của bạn đã hết hạn. Tài khoản của bạn được chuyển về gói Miễn phí (FREE). Vui lòng gia hạn hoặc nâng cấp gói mới để tiếp tục nhận đầy đủ quyền lợi.",
                        sub.getPlan().getDisplayName());

                try {
                    notificationService.createAndSendNotification(
                            sub.getUser(),
                            title,
                            content,
                            NotificationType.SYSTEM);
                } catch (Exception e) {
                    log.error("Lỗi khi gửi thông báo hết hạn gói cước qua WebSocket cho user {}: {}",
                            sub.getUser().getEmail(), e.getMessage());
                }

                // 4. Gửi email thông báo
                try {
                    emailService.sendSubscriptionExpiredEmail(
                            sub.getUser().getEmail(),
                            sub.getUser().getFullName(),
                            sub.getPlan().getDisplayName());
                } catch (Exception e) {
                    log.error("Lỗi khi gửi email thông báo hết hạn gói cước cho user {}: {}", sub.getUser().getEmail(),
                            e.getMessage());
                }

            } catch (Exception e) {
                log.error("Lỗi xảy ra khi xử lý hết hạn gói cước cho UserSubscription ID: {}: {}", sub.getId(),
                        e.getMessage(), e);
            }
        }

        log.info("Hoàn tất quét và xử lý các gói cước hết hạn.");
    }
}
