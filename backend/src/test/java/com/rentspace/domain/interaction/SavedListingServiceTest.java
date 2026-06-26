package com.rentspace.domain.interaction;

import com.rentspace.domain.interaction.dto.InteractionTrackRequest;
import com.rentspace.domain.interaction.dto.SaveToggleResponse;
import com.rentspace.domain.listing.Listing;
import com.rentspace.domain.listing.ListingMapper;
import com.rentspace.domain.listing.ListingRepository;
import com.rentspace.domain.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SavedListingServiceTest {

    @Mock private SavedListingRepository savedListingRepository;
    @Mock private ListingRepository listingRepository;
    @Mock private UserRepository userRepository;
    @Mock private ListingMapper listingMapper;
    @Mock private InteractionTrackingService interactionTrackingService;

    @InjectMocks
    private SavedListingServiceImpl savedListingService;

    private com.rentspace.domain.user.User mockUser;
    private Listing mockListing;

    @BeforeEach
    void setUp() {
        mockUser = mock(com.rentspace.domain.user.User.class);
        when(mockUser.getId()).thenReturn(1L);
        when(mockUser.getEmail()).thenReturn("tenant@example.com");

        mockListing = mock(Listing.class);
        when(mockListing.getId()).thenReturn(10L);
    }

    // ===== toggleSave: chưa lưu → lưu =====

    @Test
    void toggleSave_whenNotYetSaved_shouldSaveAndReturnTrue() {
        SavedListingId savedId = new SavedListingId(1L, 10L);
        when(savedListingRepository.existsById(savedId)).thenReturn(false);
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        when(listingRepository.findById(10L)).thenReturn(Optional.of(mockListing));
        when(savedListingRepository.countByListingId(10L)).thenReturn(1);

        SaveToggleResponse result = savedListingService.toggleSave(1L, 10L);

        assertTrue(result.isSaved());
        assertEquals(1, result.totalSaves());
        verify(savedListingRepository).save(any(SavedListing.class));
        // trackInteraction SAVE phải được gọi (via interactionTrackingService)
        verify(interactionTrackingService).track(eq("tenant@example.com"),
                any(InteractionTrackRequest.class));
    }

    // ===== toggleSave: đã lưu → bỏ lưu =====

    @Test
    void toggleSave_whenAlreadySaved_shouldUnsaveAndReturnFalse() {
        SavedListingId savedId = new SavedListingId(1L, 10L);
        when(savedListingRepository.existsById(savedId)).thenReturn(true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        when(savedListingRepository.countByListingId(10L)).thenReturn(0);

        SaveToggleResponse result = savedListingService.toggleSave(1L, 10L);

        assertFalse(result.isSaved());
        assertEquals(0, result.totalSaves());
        verify(savedListingRepository).deleteById(savedId);
        verify(interactionTrackingService).track(eq("tenant@example.com"),
                any(InteractionTrackRequest.class));
    }

    // ===== State machine: save → unsave → save =====

    @Test
    void toggleSave_sequentialSaveUnsaveSave_shouldTrackThreeTimes() {
        SavedListingId savedId = new SavedListingId(2L, 20L);

        // Lần 1: chưa lưu → lưu
        com.rentspace.domain.user.User user2 = mock(com.rentspace.domain.user.User.class);
        when(user2.getId()).thenReturn(2L);
        when(user2.getEmail()).thenReturn("user2@example.com");

        Listing listing2 = mock(Listing.class);
        when(listing2.getId()).thenReturn(20L);

        when(savedListingRepository.existsById(savedId))
                .thenReturn(false)  // lần 1: chưa lưu
                .thenReturn(true)   // lần 2: đã lưu
                .thenReturn(false); // lần 3: chưa lưu
        when(userRepository.findById(2L)).thenReturn(Optional.of(user2));
        when(listingRepository.findById(20L)).thenReturn(Optional.of(listing2));
        when(savedListingRepository.countByListingId(20L)).thenReturn(1, 0, 1);

        SaveToggleResponse r1 = savedListingService.toggleSave(2L, 20L);
        SaveToggleResponse r2 = savedListingService.toggleSave(2L, 20L);
        SaveToggleResponse r3 = savedListingService.toggleSave(2L, 20L);

        assertTrue(r1.isSaved());
        assertFalse(r2.isSaved());
        assertTrue(r3.isSaved());
        verify(interactionTrackingService, times(3)).track(anyString(), any());
    }

    // ===== isSaved =====

    @Test
    void isSaved_shouldDelegateToRepository() {
        when(savedListingRepository.existsByUserIdAndListingId(1L, 10L)).thenReturn(true);
        assertTrue(savedListingService.isSaved(1L, 10L));
        verify(savedListingRepository).existsByUserIdAndListingId(1L, 10L);
    }

    @Test
    void isSaved_whenNotSaved_shouldReturnFalse() {
        when(savedListingRepository.existsByUserIdAndListingId(1L, 99L)).thenReturn(false);
        assertFalse(savedListingService.isSaved(1L, 99L));
    }

    // ===== getSavedListings =====

    @Test
    void getSavedListings_shouldReturnMappedPage() {
        SavedListing savedListing = mock(SavedListing.class);
        when(savedListing.getListing()).thenReturn(mockListing);
        when(savedListingRepository.findAllByUserId(eq(1L), any()))
                .thenReturn(new PageImpl<>(List.of(savedListing)));
        when(listingMapper.toResponse(mockListing))
                .thenReturn(mock(com.rentspace.domain.listing.dto.ListingResponse.class));

        var page = savedListingService.getSavedListings(1L, PageRequest.of(0, 12));

        assertEquals(1, page.getTotalElements());
        verify(listingMapper).toResponse(mockListing);
    }
}
