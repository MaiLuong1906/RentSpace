package com.rentspace.domain.roommate;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rentspace.common.exception.BusinessException;
import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.domain.notification.NotificationService;
import com.rentspace.domain.notification.enums.NotificationType;
import com.rentspace.domain.roommate.dto.RoommateMatchResponse;
import com.rentspace.domain.roommate.dto.RoommateProfileRequest;
import com.rentspace.domain.roommate.dto.RoommateProfileResponse;
import com.rentspace.domain.roommate.enums.MatchStatus;
import com.rentspace.domain.roommate.enums.ProfileType;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.enums.KycStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoommateServiceImpl implements RoommateService {

    private final RoommateProfileRepository profileRepository;
    private final RoommateMatchRepository matchRepository;
    private final RoommateMapper roommateMapper;
    private final RoommateMatchingEngine matchingEngine;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final NotificationService notificationService;

    private static final String CACHE_PREFIX = "roommate:suggestions:";
    private static final long CACHE_TTL_HOURS = 1;

    @Override
    @Transactional(readOnly = true)
    public RoommateProfileResponse getProfile(User currentUser) {
        RoommateProfile profile = profileRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Bạn chưa tạo hồ sơ tìm bạn ở ghép"));
        return roommateMapper.toResponse(profile);
    }

    @Override
    @Transactional
    public RoommateProfileResponse updateProfile(RoommateProfileRequest request, User currentUser) {
        if (currentUser.getKycStatus() != KycStatus.VERIFIED) {
            throw new BusinessException("Tài khoản chưa được xác thực KYC. Hãy hoàn tất KYC để sử dụng tính năng này");
        }

        // Validation bổ sung cho HAS_ROOM
        if (request.getProfileType() == ProfileType.HAS_ROOM) {
            if (request.getMaxOccupants() == null) {
                throw new BusinessException("Vui lòng điền số người tối đa cho phòng (maxOccupants)");
            }
            if (request.getCurrentOccupants() == null) {
                throw new BusinessException("Vui lòng điền số người đang ở hiện tại (currentOccupants)");
            }
            if (request.getCurrentOccupants() >= request.getMaxOccupants()) {
                throw new BusinessException("Phòng đã đủ người ở. Vui lòng cập nhật lại số người hoặc số chỗ tối đa");
            }
        }

        Optional<RoommateProfile> existingProfileOpt = profileRepository.findByUserId(currentUser.getId());
        RoommateProfile profile;

        if (existingProfileOpt.isPresent()) {
            profile = existingProfileOpt.get();
            roommateMapper.updateEntityFromRequest(request, profile);
            profile.setUpdatedAt(LocalDateTime.now());
        } else {
            profile = roommateMapper.toEntity(request);
            profile.setUser(currentUser);
            profile.setCreatedAt(LocalDateTime.now());
            profile.setUpdatedAt(LocalDateTime.now());
        }

        RoommateProfile savedProfile = profileRepository.save(profile);
        evictSuggestionsCache(currentUser.getId());

        return roommateMapper.toResponse(savedProfile);
    }

    @Override
    @Transactional
    public List<RoommateMatchResponse> getSuggestions(User currentUser) {
        if (currentUser.getKycStatus() != KycStatus.VERIFIED) {
            throw new BusinessException("Tài khoản chưa được xác thực KYC. Hãy hoàn tất KYC để sử dụng tính năng này");
        }

        RoommateProfile myProfile = profileRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new BusinessException("Bạn cần tạo hồ sơ ở ghép trước khi xem gợi ý"));

        if (Boolean.FALSE.equals(myProfile.getIsActive())) {
            throw new BusinessException("Hồ sơ ở ghép của bạn đang bị ẩn. Hãy kích hoạt hồ sơ để xem gợi ý");
        }

        String cacheKey = CACHE_PREFIX + currentUser.getId();
        String cachedData = redisTemplate.opsForValue().get(cacheKey);
        if (cachedData != null) {
            List<RoommateMatchResponse> cachedSuggestions = deserializeSuggestions(cachedData);
            if (cachedSuggestions != null) {
                log.info("Loaded roommate suggestions from Redis cache for userId: {}", currentUser.getId());
                return cachedSuggestions;
            }
        }

        List<RoommateProfile> otherProfiles = profileRepository.findActiveProfilesForMatching(currentUser.getId());
        List<RoommateMatch> newMatches = new ArrayList<>();
        List<RoommateMatch> updatedMatches = new ArrayList<>();

        List<RoommateMatch> existingMatches = matchRepository.findAllMatchesForProfile(myProfile.getId());
        java.util.Map<Long, RoommateMatch> matchMap = new java.util.HashMap<>();
        for (RoommateMatch match : existingMatches) {
            Long otherProfileId = match.getProfileA().getId().equals(myProfile.getId())
                    ? match.getProfileB().getId()
                    : match.getProfileA().getId();
            matchMap.put(otherProfileId, match);
        }

        for (RoommateProfile otherProfile : otherProfiles) {
            RoommateMatch existingMatch = matchMap.get(otherProfile.getId());

            if (existingMatch != null) {
                if (existingMatch.getStatus() == MatchStatus.DISMISSED) {
                    continue;
                }
                BigDecimal newScore = matchingEngine.calculateMatchScore(myProfile, otherProfile);
                existingMatch.setMatchScore(newScore);
                updatedMatches.add(existingMatch);
            } else {
                BigDecimal score = matchingEngine.calculateMatchScore(myProfile, otherProfile);
                if (score.compareTo(BigDecimal.valueOf(50)) >= 0) {
                    RoommateMatch match = RoommateMatch.builder()
                            .profileA(myProfile)
                            .profileB(otherProfile)
                            .matchScore(score)
                            .status(MatchStatus.SUGGESTED)
                            .build();
                    newMatches.add(match);
                }
            }
        }

        if (!newMatches.isEmpty()) matchRepository.saveAll(newMatches);
        if (!updatedMatches.isEmpty()) matchRepository.saveAll(updatedMatches);

        List<RoommateMatch> suggestions = matchRepository.findSuggestions(myProfile.getId());
        List<RoommateMatch> topSuggestions = suggestions.stream().limit(10).toList();

        List<RoommateMatchResponse> responseList = topSuggestions.stream()
                .map(roommateMapper::toResponse)
                .toList();

        String serializedData = serializeSuggestions(responseList);
        if (serializedData != null) {
            redisTemplate.opsForValue().set(cacheKey, serializedData, CACHE_TTL_HOURS, TimeUnit.HOURS);
        }

        return responseList;
    }

    @Override
    @Transactional
    public void dismissMatch(Long matchId, User currentUser) {
        RoommateMatch match = matchRepository.findById(matchId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin gợi ý"));

        RoommateProfile myProfile = profileRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new BusinessException("Không tìm thấy hồ sơ ở ghép của bạn"));

        if (!match.getProfileA().getId().equals(myProfile.getId()) &&
            !match.getProfileB().getId().equals(myProfile.getId())) {
            throw new BusinessException("Bạn không có quyền từ chối gợi ý này");
        }

        match.setStatus(MatchStatus.DISMISSED);
        matchRepository.save(match);

        evictSuggestionsCache(match.getProfileA().getUser().getId());
        evictSuggestionsCache(match.getProfileB().getUser().getId());
    }

    @Override
    @Transactional
    public RoommateMatchResponse expressInterest(Long matchId, User currentUser) {
        RoommateMatch match = matchRepository.findById(matchId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin gợi ý"));

        RoommateProfile myProfile = profileRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new BusinessException("Không tìm thấy hồ sơ ở ghép của bạn"));

        boolean isProfileA = match.getProfileA().getId().equals(myProfile.getId());
        boolean isProfileB = match.getProfileB().getId().equals(myProfile.getId());

        if (!isProfileA && !isProfileB) {
            throw new BusinessException("Bạn không có quyền thực hiện thao tác này");
        }

        if (match.getStatus() == MatchStatus.DISMISSED) {
            throw new BusinessException("Gợi ý này đã bị từ chối trước đó");
        }
        if (match.getStatus() == MatchStatus.CONTACTED) {
            throw new BusinessException("Hai bên đã kết nối. Hãy liên hệ trực tiếp với nhau");
        }

        // Idempotency: đã express rồi thì trả về state hiện tại, không gửi notification lại
        if (isProfileA && Boolean.TRUE.equals(match.getProfileAInterested())) {
            return roommateMapper.toResponse(match);
        }
        if (isProfileB && Boolean.TRUE.equals(match.getProfileBInterested())) {
            return roommateMapper.toResponse(match);
        }

        if (isProfileA) match.setProfileAInterested(true);
        if (isProfileB) match.setProfileBInterested(true);

        // Khi cả hai bên đều quan tâm → kết nối thành công
        if (Boolean.TRUE.equals(match.getProfileAInterested()) && Boolean.TRUE.equals(match.getProfileBInterested())) {
            match.setStatus(MatchStatus.CONTACTED);
            notifyBothMatched(match);
        } else {
            match.setStatus(MatchStatus.VIEWED);
            // Thông báo cho phía bên kia biết có người quan tâm
            User otherUser = isProfileA
                    ? match.getProfileB().getUser()
                    : match.getProfileA().getUser();
            notifyInterestReceived(otherUser, currentUser.getFullName());
        }

        RoommateMatch saved = matchRepository.save(match);
        evictSuggestionsCache(match.getProfileA().getUser().getId());
        evictSuggestionsCache(match.getProfileB().getUser().getId());

        return roommateMapper.toResponse(saved);
    }

    private void notifyBothMatched(RoommateMatch match) {
        String message = "Chúc mừng! Bạn và %s đã cùng quan tâm nhau. Hãy liên hệ để sắp xếp gặp mặt!";
        try {
            notificationService.createAndSendNotification(
                    match.getProfileA().getUser(),
                    "Kết nối ở ghép thành công!",
                    String.format(message, match.getProfileB().getUser().getFullName()),
                    NotificationType.ROOMMATE
            );
            notificationService.createAndSendNotification(
                    match.getProfileB().getUser(),
                    "Kết nối ở ghép thành công!",
                    String.format(message, match.getProfileA().getUser().getFullName()),
                    NotificationType.ROOMMATE
            );
        } catch (Exception e) {
            log.warn("Failed to send CONTACTED notification for matchId: {}", match.getId(), e);
        }
    }

    private void notifyInterestReceived(User receiver, String senderName) {
        try {
            notificationService.createAndSendNotification(
                    receiver,
                    "Có người quan tâm đến hồ sơ của bạn",
                    String.format("%s đã bày tỏ sự quan tâm đến hồ sơ ở ghép của bạn!", senderName),
                    NotificationType.ROOMMATE
            );
        } catch (Exception e) {
            log.warn("Failed to send interest notification to userId: {}", receiver.getId(), e);
        }
    }

    private void evictSuggestionsCache(Long userId) {
        redisTemplate.delete(CACHE_PREFIX + userId);
    }

    private String serializeSuggestions(List<RoommateMatchResponse> suggestions) {
        try {
            return objectMapper.writeValueAsString(suggestions);
        } catch (Exception e) {
            log.warn("Failed to serialize suggestions list to JSON string", e);
            return null;
        }
    }

    private List<RoommateMatchResponse> deserializeSuggestions(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<List<RoommateMatchResponse>>() {});
        } catch (Exception e) {
            log.warn("Failed to deserialize suggestions list from JSON string", e);
            return null;
        }
    }
}
