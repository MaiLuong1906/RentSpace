package com.rentspace.domain.contract;

import com.rentspace.domain.deposit.DepositTransaction;
import com.rentspace.domain.listing.Listing;
import com.rentspace.domain.notification.NotificationService;
import com.rentspace.domain.notification.enums.NotificationType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ContractExpirySchedulerTest {

    @Mock private ContractRepository contractRepository;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private ContractExpiryScheduler scheduler;

    private com.rentspace.domain.user.User landlord;
    private com.rentspace.domain.user.User tenant;
    private Listing listing;
    private DepositTransaction deposit;

    @BeforeEach
    void setUp() {
        landlord = com.rentspace.domain.user.User.builder()
                .id(1L).email("landlord@test.com").fullName("Chủ nhà").build();
        tenant = com.rentspace.domain.user.User.builder()
                .id(2L).email("tenant@test.com").fullName("Người thuê").build();
        listing = Listing.builder()
                .id(10L).title("Phòng trọ Bình Thạnh").landlord(landlord).build();
        deposit = DepositTransaction.builder()
                .id(100L).listing(listing).landlord(landlord).tenant(tenant)
                .amount(3_000_000L).platformFee(150_000L).netAmount(2_850_000L)
                .build();
    }

    private Contract buildContract(ContractStatus status, Instant expiresAt) {
        return Contract.builder()
                .id(50L).deposit(deposit).landlord(landlord).tenant(tenant)
                .contentSnapshot("<html/>").status(status)
                .expiresAt(expiresAt)
                .createdAt(Instant.now().minus(2, ChronoUnit.DAYS))
                .build();
    }

    // ── expireOverdueContracts ───────────────────────────────────────────────

    @Nested
    class ExpireOverdueContracts {

        @Test
        void whenOverdueContractsExist_setsExpiredAndNotifiesBothParties() {
            Contract overdue = buildContract(
                    ContractStatus.PENDING_SIGNATURES,
                    Instant.now().minus(1, ChronoUnit.HOURS));

            when(contractRepository.findAllByStatusAndExpiresAtBefore(
                    eq(ContractStatus.PENDING_SIGNATURES), any(Instant.class)))
                    .thenReturn(List.of(overdue));
            when(contractRepository.save(any())).thenReturn(overdue);

            scheduler.expireOverdueContracts();

            assertThat(overdue.getStatus()).isEqualTo(ContractStatus.EXPIRED);
            verify(contractRepository).save(overdue);
            // Landlord + tenant đều nhận thông báo
            verify(notificationService, times(2))
                    .createAndSendNotification(any(), anyString(), anyString(),
                            eq(NotificationType.SYSTEM));
        }

        @Test
        void whenNoOverdueContracts_doesNothing() {
            when(contractRepository.findAllByStatusAndExpiresAtBefore(
                    any(), any())).thenReturn(List.of());

            scheduler.expireOverdueContracts();

            verify(contractRepository, never()).save(any());
            verify(notificationService, never())
                    .createAndSendNotification(any(), anyString(), anyString(), any());
        }
    }

    // ── promoteDraftContracts ───────────────────────────────────────────────

    @Nested
    class PromoteDraftContracts {

        @Test
        void whenDraftOlderThan24h_setsPendingSignaturesAndNotifiesBothParties() {
            Contract draft = buildContract(
                    ContractStatus.DRAFT,
                    Instant.now().plus(6, ChronoUnit.DAYS));

            when(contractRepository.findAllByStatusAndCreatedAtBefore(
                    eq(ContractStatus.DRAFT), any(Instant.class)))
                    .thenReturn(List.of(draft));
            when(contractRepository.save(any())).thenReturn(draft);

            scheduler.promoteDraftContracts();

            assertThat(draft.getStatus()).isEqualTo(ContractStatus.PENDING_SIGNATURES);
            verify(contractRepository).save(draft);
            verify(notificationService, times(2))
                    .createAndSendNotification(any(), anyString(), anyString(),
                            eq(NotificationType.SYSTEM));
        }

        @Test
        void whenNoDraftToPromote_doesNothing() {
            when(contractRepository.findAllByStatusAndCreatedAtBefore(
                    any(), any())).thenReturn(List.of());

            scheduler.promoteDraftContracts();

            verify(contractRepository, never()).save(any());
        }
    }

    // ── sendExpiryReminders ─────────────────────────────────────────────────

    @Nested
    class SendExpiryReminders {

        @Test
        void whenNeitherPartyHasSigned_notifiesBoth() {
            Contract expiringSoon = buildContract(
                    ContractStatus.PENDING_SIGNATURES,
                    Instant.now().plus(2, ChronoUnit.DAYS));
            // Chưa ai ký
            assertThat(expiringSoon.getLandlordSignedAt()).isNull();
            assertThat(expiringSoon.getTenantSignedAt()).isNull();

            when(contractRepository.findExpiringSoon(any(), any()))
                    .thenReturn(List.of(expiringSoon));

            scheduler.sendExpiryReminders();

            ArgumentCaptor<com.rentspace.domain.user.User> userCaptor =
                    ArgumentCaptor.forClass(com.rentspace.domain.user.User.class);
            verify(notificationService, times(2))
                    .createAndSendNotification(userCaptor.capture(), anyString(),
                            anyString(), eq(NotificationType.SYSTEM));

            assertThat(userCaptor.getAllValues())
                    .extracting(com.rentspace.domain.user.User::getEmail)
                    .containsExactlyInAnyOrder("landlord@test.com", "tenant@test.com");
        }

        @Test
        void whenLandlordAlreadySigned_onlyNotifiesTenant() {
            Contract expiringSoon = buildContract(
                    ContractStatus.PENDING_SIGNATURES,
                    Instant.now().plus(1, ChronoUnit.DAYS));
            expiringSoon.setLandlordSignedAt(Instant.now().minusSeconds(3600));

            when(contractRepository.findExpiringSoon(any(), any()))
                    .thenReturn(List.of(expiringSoon));

            scheduler.sendExpiryReminders();

            ArgumentCaptor<com.rentspace.domain.user.User> userCaptor =
                    ArgumentCaptor.forClass(com.rentspace.domain.user.User.class);
            verify(notificationService, times(1))
                    .createAndSendNotification(userCaptor.capture(), anyString(),
                            anyString(), eq(NotificationType.SYSTEM));
            assertThat(userCaptor.getValue().getEmail()).isEqualTo("tenant@test.com");
        }

        @Test
        void whenNoExpiringSoon_doesNothing() {
            when(contractRepository.findExpiringSoon(any(), any()))
                    .thenReturn(List.of());

            scheduler.sendExpiryReminders();

            verify(notificationService, never())
                    .createAndSendNotification(any(), anyString(), anyString(), any());
        }
    }
}
