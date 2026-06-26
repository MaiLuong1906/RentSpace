package com.rentspace.domain.interaction;

import com.rentspace.domain.interaction.dto.InteractionTrackRequest;
import com.rentspace.domain.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InteractionTrackingServiceTest {

    @Mock
    private InteractionRepository interactionRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private InteractionTrackingServiceImpl interactionTrackingService;

    private com.rentspace.domain.user.User mockUser;

    @BeforeEach
    void setUp() {
        mockUser = mock(com.rentspace.domain.user.User.class);
        when(mockUser.getId()).thenReturn(1L);
    }

    // ===== VIEW dedup =====

    @Test
    void track_viewEvent_withRecentDuplicate_shouldNotSave() {
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(mockUser));
        when(interactionRepository.existsRecentView(eq(1L), eq(42L), any(Instant.class))).thenReturn(true);

        interactionTrackingService.track("user@example.com",
                new InteractionTrackRequest(42L, InteractionType.VIEW, null, "DIRECT", "s1"));

        verify(interactionRepository, never()).save(any());
    }

    @Test
    void track_viewEvent_withoutRecentDuplicate_shouldSave() {
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(mockUser));
        when(interactionRepository.existsRecentView(eq(1L), eq(42L), any(Instant.class))).thenReturn(false);

        interactionTrackingService.track("user@example.com",
                new InteractionTrackRequest(42L, InteractionType.VIEW, 45, "SEARCH", "s1"));

        verify(interactionRepository).save(any(UserListingInteraction.class));
    }

    // ===== Anonymous user =====

    @Test
    void track_viewEvent_anonymous_shouldAlwaysSave() {
        // Anonymous: không có email → userId null → bỏ qua dedup
        interactionTrackingService.track(null,
                new InteractionTrackRequest(42L, InteractionType.VIEW, 10, "SEO", "anon-session"));

        verify(interactionRepository).save(any(UserListingInteraction.class));
        verify(interactionRepository, never()).existsRecentView(any(), any(), any());
    }

    // ===== Non-VIEW events không dedup =====

    @Test
    void track_saveEvent_shouldAlwaysSave_withoutDedup() {
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(mockUser));

        interactionTrackingService.track("user@example.com",
                new InteractionTrackRequest(10L, InteractionType.SAVE, null, null, null));

        verify(interactionRepository).save(any(UserListingInteraction.class));
        verify(interactionRepository, never()).existsRecentView(any(), any(), any());
    }

    @Test
    void track_chatInitEvent_shouldAlwaysSave_withoutDedup() {
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(mockUser));

        interactionTrackingService.track("user@example.com",
                new InteractionTrackRequest(10L, InteractionType.CHAT_INIT, null, "DIRECT", null));

        verify(interactionRepository).save(any(UserListingInteraction.class));
        verify(interactionRepository, never()).existsRecentView(any(), any(), any());
    }

    @Test
    void track_unknownEmail_shouldSaveWithNullUserId() {
        when(userRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

        interactionTrackingService.track("ghost@example.com",
                new InteractionTrackRequest(5L, InteractionType.VIEW, 20, "DIRECT", "s2"));

        // userId null → không dedup, vẫn lưu
        verify(interactionRepository).save(any(UserListingInteraction.class));
    }
}
