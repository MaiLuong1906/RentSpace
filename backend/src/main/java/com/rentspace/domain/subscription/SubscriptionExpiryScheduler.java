package com.rentspace.domain.subscription;

import com.rentspace.domain.listing.Listing;
import com.rentspace.domain.listing.ListingRepository;
import com.rentspace.domain.listing.enums.ListingStatus;
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
    private final ListingRepository listingRepository;

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
                UserSubscription freeSub = subscriptionService.getOrCreateDefaultFreeSubscription(sub.getUser());
                int freeLimit = freeSub.getPlan().getMaxListings();

                log.info("Đã chuyển đổi gói cước của User ID: {} sang EXPIRED và fallback về gói FREE (giới hạn {} tin).",
                        sub.getUser().getId(), freeLimit);

                // 3. Ẩn các tin đăng vượt quá giới hạn FREE — giữ lại freeLimit tin mới nhất
                deactivateExcessListings(sub.getUser().getId(), freeLimit);

                // 4. Gửi thông báo hệ thống qua WebSocket
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

                // 5. Gửi email thông báo
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

    private void deactivateExcessListings(Long landlordId, int freeLimit) {
        List<Listing> activeListings = listingRepository
                .findByLandlordIdAndStatusOrderByCreatedAtDesc(landlordId, ListingStatus.ACTIVE);

        if (activeListings.size() <= freeLimit) return;

        List<Listing> toDeactivate = activeListings.subList(freeLimit, activeListings.size());
        toDeactivate.forEach(l -> l.setStatus(ListingStatus.INACTIVE));
        listingRepository.saveAll(toDeactivate);

        log.info("Đã tạm ẩn {} tin đăng vượt giới hạn FREE cho landlord ID: {}", toDeactivate.size(), landlordId);
    }
}
