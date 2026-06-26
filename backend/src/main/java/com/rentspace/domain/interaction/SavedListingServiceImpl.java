package com.rentspace.domain.interaction;

import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.domain.interaction.dto.InteractionTrackRequest;
import com.rentspace.domain.interaction.dto.SaveToggleResponse;
import com.rentspace.domain.listing.Listing;
import com.rentspace.domain.listing.ListingMapper;
import com.rentspace.domain.listing.ListingRepository;
import com.rentspace.domain.listing.dto.ListingResponse;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class SavedListingServiceImpl implements SavedListingService {

    private final SavedListingRepository savedListingRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final ListingMapper listingMapper;
    private final InteractionTrackingService interactionTrackingService;

    @Override
    @Transactional
    public SaveToggleResponse toggleSave(Long userId, Long listingId) {
        SavedListingId savedId = new SavedListingId(userId, listingId);
        boolean currentlySaved = savedListingRepository.existsById(savedId);

        if (currentlySaved) {
            savedListingRepository.deleteById(savedId);
            trackInteraction(userId, listingId, InteractionType.UNSAVE);
            int totalSaves = savedListingRepository.countByListingId(listingId);
            return new SaveToggleResponse(false, totalSaves);
        } else {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));
            Listing listing = listingRepository.findById(listingId)
                    .orElseThrow(() -> new ResourceNotFoundException("Tin đăng không tồn tại"));

            SavedListing savedListing = SavedListing.builder()
                    .id(savedId)
                    .user(user)
                    .listing(listing)
                    .build();
            savedListingRepository.save(savedListing);
            trackInteraction(userId, listingId, InteractionType.SAVE);
            int totalSaves = savedListingRepository.countByListingId(listingId);
            return new SaveToggleResponse(true, totalSaves);
        }
    }

    @Override
    public Page<ListingResponse> getSavedListings(Long userId, Pageable pageable) {
        return savedListingRepository.findAllByUserId(userId, pageable)
                .map(saved -> {
                    ListingResponse response = listingMapper.toResponse(saved.getListing());
                    response.setIsSavedByCurrentUser(true);
                    return response;
                });
    }

    @Override
    public boolean isSaved(Long userId, Long listingId) {
        return savedListingRepository.existsByUserIdAndListingId(userId, listingId);
    }

    private void trackInteraction(Long userId, Long listingId, InteractionType type) {
        String email = userRepository.findById(userId)
                .map(u -> u.getEmail())
                .orElse(null);
        interactionTrackingService.track(email,
                new InteractionTrackRequest(listingId, type, null, null, null));
    }
}
