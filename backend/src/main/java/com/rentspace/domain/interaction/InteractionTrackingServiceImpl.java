package com.rentspace.domain.interaction;

import com.rentspace.domain.interaction.dto.InteractionTrackRequest;
import com.rentspace.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class InteractionTrackingServiceImpl implements InteractionTrackingService {

    private final InteractionRepository interactionRepository;
    private final UserRepository userRepository;

    @Async
    @Override
    @Transactional
    public void track(String userEmail, InteractionTrackRequest req) {
        Long userId = resolveUserId(userEmail);

        // Dedup: không ghi thêm VIEW cùng user + listing trong vòng 30 phút
        if (req.type() == InteractionType.VIEW && isRecentViewDuplicate(userId, req.listingId())) {
            return;
        }

        UserListingInteraction interaction = UserListingInteraction.builder()
                .userId(userId)
                .sessionId(req.sessionId())
                .listingId(req.listingId())
                .interactionType(req.type())
                .viewDurationSec(req.viewDurationSec())
                .referrer(req.referrer())
                .build();

        interactionRepository.save(interaction);
        log.debug("Tracked {} interaction: listing={}, user={}, session={}",
                req.type(), req.listingId(), userId, req.sessionId());
    }

    private Long resolveUserId(String email) {
        if (email == null) return null;
        return userRepository.findByEmail(email)
                .map(u -> u.getId())
                .orElse(null);
    }

    private boolean isRecentViewDuplicate(Long userId, Long listingId) {
        // Anonymous users: bỏ qua dedup (không có userId để kiểm tra)
        if (userId == null) return false;
        Instant since = Instant.now().minus(30, ChronoUnit.MINUTES);
        return interactionRepository.existsRecentView(userId, listingId, since);
    }
}
