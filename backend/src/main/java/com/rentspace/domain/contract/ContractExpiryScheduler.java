package com.rentspace.domain.contract;

import com.rentspace.domain.notification.NotificationService;
import com.rentspace.domain.notification.enums.NotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Tự động expire hợp đồng chưa ký sau deadline (mặc định 7 ngày).
 * Chuyển DRAFT → PENDING_SIGNATURES sau 24h.
 * Gửi reminder 1–3 ngày trước khi hết hạn.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ContractExpiryScheduler {

    private final ContractRepository contractRepository;
    private final NotificationService notificationService;

    /** 01:00 hàng ngày: expire hợp đồng PENDING_SIGNATURES đã quá deadline */
    @Scheduled(cron = "0 0 1 * * *")
    @Transactional
    public void expireOverdueContracts() {
        Instant now = Instant.now();

        List<Contract> overdue = contractRepository
                .findAllByStatusAndExpiresAtBefore(ContractStatus.PENDING_SIGNATURES, now);

        if (overdue.isEmpty()) {
            log.debug("ContractExpiryScheduler: không có hợp đồng nào cần expire.");
            return;
        }

        overdue.forEach(c -> {
            c.setStatus(ContractStatus.EXPIRED);
            contractRepository.save(c);
            log.info("Hợp đồng id={} đã EXPIRED (deadline: {})", c.getId(), c.getExpiresAt());

            String msg = "Hợp đồng thuê phòng đã hết hạn do không được ký đầy đủ trong thời gian quy định.";
            notificationService.createAndSendNotification(c.getLandlord(), "Hợp đồng đã hết hạn", msg, NotificationType.SYSTEM);
            notificationService.createAndSendNotification(c.getTenant(),   "Hợp đồng đã hết hạn", msg, NotificationType.SYSTEM);
        });

        log.info("ContractExpiryScheduler: đã expire {} hợp đồng.", overdue.size());
    }

    /** 02:00 hàng ngày: chuyển hợp đồng DRAFT đã qua 24h sang PENDING_SIGNATURES */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void promoteDraftContracts() {
        Instant cutoff = Instant.now().minus(24, ChronoUnit.HOURS);

        List<Contract> drafts = contractRepository
                .findAllByStatusAndCreatedAtBefore(ContractStatus.DRAFT, cutoff);

        if (drafts.isEmpty()) {
            log.debug("ContractExpiryScheduler: không có hợp đồng DRAFT nào cần chuyển.");
            return;
        }

        drafts.forEach(c -> {
            c.setStatus(ContractStatus.PENDING_SIGNATURES);
            contractRepository.save(c);
            log.info("Hợp đồng id={} DRAFT → PENDING_SIGNATURES", c.getId());

            String msg = String.format(
                    "Hợp đồng thuê phòng \"%s\" đã chuyển sang giai đoạn ký. Vui lòng ký hợp đồng trước %s.",
                    c.getDeposit().getListing().getTitle(),
                    c.getExpiresAt().toString());
            notificationService.createAndSendNotification(c.getLandlord(), "Hợp đồng đang chờ ký", msg, NotificationType.SYSTEM);
            notificationService.createAndSendNotification(c.getTenant(),   "Hợp đồng đang chờ ký", msg, NotificationType.SYSTEM);
        });

        log.info("ContractExpiryScheduler: đã chuyển {} hợp đồng DRAFT → PENDING_SIGNATURES.", drafts.size());
    }

    /** 09:00 hàng ngày: nhắc nhở các hợp đồng sắp hết hạn (còn 1–3 ngày) */
    @Scheduled(cron = "0 0 9 * * *")
    @Transactional(readOnly = true)
    public void sendExpiryReminders() {
        Instant from = Instant.now().plus(1, ChronoUnit.DAYS);
        Instant to   = Instant.now().plus(3, ChronoUnit.DAYS);

        List<Contract> expiringSoon = contractRepository.findExpiringSoon(from, to);
        if (expiringSoon.isEmpty()) return;

        expiringSoon.forEach(c -> {
            long daysLeft = ChronoUnit.DAYS.between(Instant.now(), c.getExpiresAt());
            String msg = String.format(
                    "Hợp đồng thuê phòng \"%s\" sẽ hết hạn sau %d ngày nếu chưa được ký đầy đủ.",
                    c.getDeposit().getListing().getTitle(), daysLeft);

            if (c.getLandlordSignedAt() == null) {
                notificationService.createAndSendNotification(c.getLandlord(), "Nhắc nhở: Chưa ký hợp đồng", msg, NotificationType.SYSTEM);
            }
            if (c.getTenantSignedAt() == null) {
                notificationService.createAndSendNotification(c.getTenant(), "Nhắc nhở: Chưa ký hợp đồng", msg, NotificationType.SYSTEM);
            }
        });

        log.info("ContractExpiryScheduler: đã gửi reminder cho {} hợp đồng sắp hết hạn.", expiringSoon.size());
    }
}
