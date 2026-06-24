package com.rentspace.domain.notification;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rentspace.domain.notification.webpush.WebPushServiceImpl;
import com.rentspace.domain.notification.webpush.WebPushSubscription;
import com.rentspace.domain.notification.webpush.WebPushSubscriptionRepository;
import com.rentspace.domain.notification.webpush.dto.WebPushPayload;
import com.rentspace.domain.notification.webpush.dto.WebPushSubscribeRequest;
import com.rentspace.domain.user.UserRepository;
import nl.martijndwars.webpush.PushService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.junit.jupiter.api.BeforeAll;

import java.security.Security;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WebPushServiceImplTest {

    @Mock private WebPushSubscriptionRepository subscriptionRepository;
    @Mock private UserRepository userRepository;
    @Mock private PushService pushService;
    @Mock private ObjectMapper objectMapper;

    @InjectMocks
    private WebPushServiceImpl webPushService;

    @BeforeAll
    static void registerBouncyCastle() {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
    }

    private com.rentspace.domain.user.User user;
    private WebPushSubscription activeSubscription;

    @BeforeEach
    void setUp() {
        user = com.rentspace.domain.user.User.builder()
                .id(1L)
                .email("tenant1@rentspace.com")
                .fullName("Nguyễn Văn A")
                .build();

        // p256dh phải là P-256 uncompressed key hợp lệ (65 bytes = 87 chars base64url)
        // auth phải là 16 bytes (22 chars base64url) — BouncyCastle validate ngay ở constructor Notification
        activeSubscription = WebPushSubscription.builder()
                .id(10L)
                .user(user)
                .endpoint("https://fcm.googleapis.com/fcm/send/test-endpoint")
                .p256dh("BNweh91arBwyGpfg10JQ-mZWQNCtKSFguAxp9J2NuDmdyCvNKsNnLMO_FwJqo2SrSDQVvl_Nk420EEJnD5bd8DM")
                .auth("b7N9HQLnABNdwwoSdbJQcg")
                .isActive(true)
                .build();
    }

    // ===== subscribe() =====

    @Test
    void subscribe_WhenNewEndpoint_SavesNewSubscription() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(subscriptionRepository.findByEndpoint(any())).thenReturn(Optional.empty());
        when(subscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        WebPushSubscribeRequest request = new WebPushSubscribeRequest(
                "https://fcm.googleapis.com/fcm/send/new-endpoint",
                new WebPushSubscribeRequest.PushKeys("p256dh-key", "auth-key"),
                "Chrome/125"
        );

        webPushService.subscribe(1L, request);

        ArgumentCaptor<WebPushSubscription> captor = ArgumentCaptor.forClass(WebPushSubscription.class);
        verify(subscriptionRepository).save(captor.capture());

        WebPushSubscription saved = captor.getValue();
        assertEquals("https://fcm.googleapis.com/fcm/send/new-endpoint", saved.getEndpoint());
        assertEquals("p256dh-key", saved.getP256dh());
        assertEquals("auth-key", saved.getAuth());
        assertEquals("Chrome/125", saved.getUserAgent());
        assertTrue(saved.getIsActive());
    }

    @Test
    void subscribe_WhenExistingEndpoint_UpdatesExistingSubscription() {
        WebPushSubscription existing = WebPushSubscription.builder()
                .id(5L)
                .user(user)
                .endpoint("https://fcm.googleapis.com/fcm/send/existing")
                .p256dh("old-key")
                .auth("old-auth")
                .isActive(false)
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(subscriptionRepository.findByEndpoint("https://fcm.googleapis.com/fcm/send/existing"))
                .thenReturn(Optional.of(existing));
        when(subscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        WebPushSubscribeRequest request = new WebPushSubscribeRequest(
                "https://fcm.googleapis.com/fcm/send/existing",
                new WebPushSubscribeRequest.PushKeys("new-key", "new-auth"),
                "Edge/125"
        );

        webPushService.subscribe(1L, request);

        // Phải reuse object cũ, không tạo mới
        verify(subscriptionRepository).save(existing);
        assertEquals("new-key", existing.getP256dh());
        assertEquals("new-auth", existing.getAuth());
        assertTrue(existing.getIsActive());
    }

    // ===== unsubscribe() =====

    @Test
    void unsubscribe_WhenEndpointExists_SetsIsActiveFalse() {
        when(subscriptionRepository.findByEndpoint(activeSubscription.getEndpoint()))
                .thenReturn(Optional.of(activeSubscription));

        webPushService.unsubscribe(activeSubscription.getEndpoint());

        assertFalse(activeSubscription.getIsActive());
        verify(subscriptionRepository).save(activeSubscription);
    }

    @Test
    void unsubscribe_WhenEndpointNotFound_DoesNothing() {
        when(subscriptionRepository.findByEndpoint("https://unknown.endpoint"))
                .thenReturn(Optional.empty());

        webPushService.unsubscribe("https://unknown.endpoint");

        verify(subscriptionRepository, never()).save(any());
    }

    // ===== sendToUser() =====

    @Test
    void sendToUser_WhenNoActiveSubscriptions_ReturnsEarly() {
        when(subscriptionRepository.findAllByUserIdAndIsActiveTrue(1L))
                .thenReturn(List.of());

        WebPushPayload payload = WebPushPayload.builder()
                .title("Test").content("Content").url("/app").build();

        webPushService.sendToUser(1L, payload);

        verifyNoInteractions(pushService);
    }

    @Test
    void sendToUser_WhenPushSucceeds_UpdatesLastUsedAt() throws Exception {
        when(subscriptionRepository.findAllByUserIdAndIsActiveTrue(1L))
                .thenReturn(List.of(activeSubscription));
        when(objectMapper.writeValueAsBytes(any())).thenReturn("{\"title\":\"Test\"}".getBytes());

        WebPushPayload payload = WebPushPayload.builder()
                .title("Test").content("Nội dung thông báo").url("/app/notifications").build();

        webPushService.sendToUser(1L, payload);

        verify(pushService).send(any());
        verify(subscriptionRepository).save(activeSubscription);
        assertNotNull(activeSubscription.getLastUsedAt());
    }

    @Test
    void sendToUser_When410Error_DeactivatesSubscription() throws Exception {
        when(subscriptionRepository.findAllByUserIdAndIsActiveTrue(1L))
                .thenReturn(List.of(activeSubscription));
        when(objectMapper.writeValueAsBytes(any())).thenReturn("{}".getBytes());
        doThrow(new RuntimeException("Server returned HTTP response code: 410"))
                .when(pushService).send(any());

        WebPushPayload payload = WebPushPayload.builder()
                .title("Test").content("Content").url("/app").build();

        webPushService.sendToUser(1L, payload);

        // Subscription hết hạn phải bị deactivate
        assertFalse(activeSubscription.getIsActive());
        verify(subscriptionRepository).save(activeSubscription);
    }

    @Test
    void sendToUser_WhenNonFatalError_KeepsSubscriptionActive() throws Exception {
        when(subscriptionRepository.findAllByUserIdAndIsActiveTrue(1L))
                .thenReturn(List.of(activeSubscription));
        when(objectMapper.writeValueAsBytes(any())).thenReturn("{}".getBytes());
        doThrow(new RuntimeException("Connection timed out"))
                .when(pushService).send(any());

        WebPushPayload payload = WebPushPayload.builder()
                .title("Test").content("Content").url("/app").build();

        webPushService.sendToUser(1L, payload);

        // Timeout không phải 410/404 → vẫn giữ active
        assertTrue(activeSubscription.getIsActive());
    }
}
