package com.rentspace.domain.verification;

import com.rentspace.domain.notification.NotificationService;
import com.rentspace.domain.notification.enums.NotificationType;
import com.rentspace.domain.user.UserRepository;
import com.rentspace.domain.user.enums.Role;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class VerificationReminderScheduler {

    private final UserVerificationRepository verificationRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    // Mỗi ngày 9:00 sáng: cảnh báo các hồ sơ PROCESSING quá 3 ngày chưa được Admin xét duyệt
    @Scheduled(cron = "0 0 9 * * *")
    public void alertStaleProcessingVerifications() {
        List<UserVerification> stale = verificationRepository.findAllByStatus(VerificationStatus.PROCESSING)
                .stream()
                .filter(v -> v.getCreatedAt().isBefore(Instant.now().minus(3, ChronoUnit.DAYS)))
                .toList();

        if (stale.isEmpty()) return;

        List<com.rentspace.domain.user.User> admins = userRepository.findByRole(Role.ADMIN);
        if (admins.isEmpty()) {
            log.warn("[VerificationReminder] {} hồ sơ chờ xét duyệt nhưng không tìm thấy admin.", stale.size());
            return;
        }

        String content = String.format(
                "Có %d hồ sơ xác minh danh tính đang ở trạng thái PROCESSING quá 3 ngày, cần xét duyệt thủ công.",
                stale.size());

        admins.forEach(admin ->
                notificationService.createAndSendNotification(
                        admin,
                        "Cảnh báo: Hồ sơ xác minh chờ xét duyệt",
                        content,
                        NotificationType.KYC));

        log.info("[VerificationReminder] Đã gửi cảnh báo {} hồ sơ PROCESSING tới {} admin.",
                stale.size(), admins.size());
    }
}
