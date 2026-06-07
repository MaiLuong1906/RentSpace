package com.rentspace.domain.notification;

import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.domain.notification.dto.NotificationResponse;
import com.rentspace.domain.notification.enums.NotificationType;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceImplTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private NotificationServiceImpl notificationService;

    private User user;
    private Notification notification;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(1L)
                .email("user@rentspace.com")
                .fullName("Test User")
                .build();

        notification = Notification.builder()
                .id(10L)
                .user(user)
                .title("Test Alert")
                .content("Alert content detail")
                .type(NotificationType.KYC)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void createAndSendNotification_ShouldSaveAndSendViaWebSocket() {
        // Given
        when(notificationRepository.save(any(Notification.class))).thenReturn(notification);

        // When
        NotificationResponse response = notificationService.createAndSendNotification(
                user, "Test Alert", "Alert content detail", NotificationType.KYC
        );

        // Then
        assertNotNull(response);
        assertEquals(10L, response.getId());
        assertEquals("Test Alert", response.getTitle());
        assertEquals(NotificationType.KYC.name(), response.getType());
        assertFalse(response.getIsRead());

        // Verify WebSocket message is sent to target user
        verify(messagingTemplate, times(1)).convertAndSendToUser(
                eq("1"), eq("/queue/notifications"), any(NotificationResponse.class)
        );
        verify(notificationRepository, times(1)).save(any(Notification.class));
    }

    @Test
    void getMyNotifications_ShouldReturnLatestFiftyNotifications() {
        // Given
        when(userRepository.findByEmail("user@rentspace.com")).thenReturn(Optional.of(user));
        
        Page<Notification> page = new PageImpl<>(Collections.singletonList(notification), PageRequest.of(0, 50), 1);
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(eq(1L), any(PageRequest.class)))
                .thenReturn(page);

        // When
        List<NotificationResponse> results = notificationService.getMyNotifications("user@rentspace.com");

        // Then
        assertNotNull(results);
        assertEquals(1, results.size());
        assertEquals("Test Alert", results.get(0).getTitle());
    }

    @Test
    void markAsRead_WhenOwner_ShouldUpdateIsRead() {
        // Given
        when(userRepository.findByEmail("user@rentspace.com")).thenReturn(Optional.of(user));
        when(notificationRepository.findById(10L)).thenReturn(Optional.of(notification));
        when(notificationRepository.save(any(Notification.class))).thenReturn(notification);

        // When
        notificationService.markAsRead(10L, "user@rentspace.com");

        // Then
        assertTrue(notification.getIsRead());
        verify(notificationRepository, times(1)).save(notification);
    }

    @Test
    void markAsRead_WhenNotOwner_ShouldThrowAccessDeniedException() {
        // Given
        User hacker = User.builder().id(99L).email("hacker@rentspace.com").build();
        when(userRepository.findByEmail("hacker@rentspace.com")).thenReturn(Optional.of(hacker));
        when(notificationRepository.findById(10L)).thenReturn(Optional.of(notification));

        // When & Then
        assertThrows(AccessDeniedException.class, () ->
                notificationService.markAsRead(10L, "hacker@rentspace.com")
        );
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void markAllAsRead_ShouldTriggerRepositoryUpdate() {
        // Given
        when(userRepository.findByEmail("user@rentspace.com")).thenReturn(Optional.of(user));

        // When
        notificationService.markAllAsRead("user@rentspace.com");

        // Then
        verify(notificationRepository, times(1)).markAllAsReadByUserId(1L);
    }
}
