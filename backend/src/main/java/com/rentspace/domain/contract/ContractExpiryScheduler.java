package com.rentspace.domain.contract;

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
 * Gửi reminder 2 ngày trước khi hết hạn.
 * Chạy lúc 01:00 hàng ngày.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ContractExpiryScheduler {

    private final ContractRepository contractRepository;

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
        });

        log.info("ContractExpiryScheduler: đã expire {} hợp đồng.", overdue.size());
    }

    @Scheduled(cron = "0 0 9 * * *")
    @Transactional(readOnly = true)
    public void sendExpiryReminders() {
        Instant from = Instant.now().plus(1, ChronoUnit.DAYS);
        Instant to   = Instant.now().plus(3, ChronoUnit.DAYS);

        List<Contract> expiringSoon = contractRepository.findExpiringSoon(from, to);
        if (expiringSoon.isEmpty()) return;

        expiringSoon.forEach(c ->
            log.warn("Reminder: hợp đồng id={} sắp hết hạn vào {} — landlord={}, tenant={}",
                    c.getId(), c.getExpiresAt(),
                    c.getLandlord().getEmail(), c.getTenant().getEmail())
        );
    }
}
