package com.rentspace.domain.verification;

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

    // Mỗi ngày 9:00 sáng: cảnh báo các hồ sơ PROCESSING quá 3 ngày chưa được Admin xét duyệt
    @Scheduled(cron = "0 0 9 * * *")
    public void alertStaleProcessingVerifications() {
        List<UserVerification> stale = verificationRepository.findAllByStatus(VerificationStatus.PROCESSING)
                .stream()
                .filter(v -> v.getCreatedAt().isBefore(Instant.now().minus(3, ChronoUnit.DAYS)))
                .toList();

        if (stale.isEmpty()) {
            return;
        }

        log.warn("[VerificationReminder] {} hồ sơ ở trạng thái PROCESSING quá 3 ngày chưa được Admin xét duyệt:",
                stale.size());
        stale.forEach(v -> log.warn("  → id={}, userId={}, createdAt={}",
                v.getId(), v.getUser().getId(), v.getCreatedAt()));
    }
}
