package com.rentspace.domain.roommate;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rentspace.common.exception.BusinessException;
import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.domain.roommate.dto.RoommateMatchResponse;
import com.rentspace.domain.roommate.dto.RoommateProfileRequest;
import com.rentspace.domain.roommate.dto.RoommateProfileResponse;
import com.rentspace.domain.roommate.enums.MatchStatus;
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
        // 1. Kiểm tra trạng thái KYC của người dùng
        if (currentUser.getKycStatus() != KycStatus.VERIFIED) {
            throw new BusinessException("Tài khoản chưa được xác thực KYC. Hãy hoàn tất KYC để sử dụng tính năng này");
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

        // 2. Xoá bộ nhớ đệm gợi ý của người dùng này vì hồ sơ đã thay đổi
        evictSuggestionsCache(currentUser.getId());

        return roommateMapper.toResponse(savedProfile);
    }

    @Override
    @Transactional
    public List<RoommateMatchResponse> getSuggestions(User currentUser) {
        // 1. Kiểm tra trạng thái KYC
        if (currentUser.getKycStatus() != KycStatus.VERIFIED) {
            throw new BusinessException("Tài khoản chưa được xác thực KYC. Hãy hoàn tất KYC để sử dụng tính năng này");
        }

        // 2. Kiểm tra hồ sơ ở ghép cá nhân
        RoommateProfile myProfile = profileRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new BusinessException("Bạn cần tạo hồ sơ ở ghép trước khi xem gợi ý"));

        if (Boolean.FALSE.equals(myProfile.getIsActive())) {
            throw new BusinessException("Hồ sơ ở ghép của bạn đang bị ẩn. Hãy kích hoạt hồ sơ để xem gợi ý");
        }

        // 3. Đọc từ Cache Redis
        String cacheKey = CACHE_PREFIX + currentUser.getId();
        String cachedData = redisTemplate.opsForValue().get(cacheKey);
        if (cachedData != null) {
            List<RoommateMatchResponse> cachedSuggestions = deserializeSuggestions(cachedData);
            if (cachedSuggestions != null) {
                log.info("Loaded roommate suggestions from Redis cache for userId: {}", currentUser.getId());
                return cachedSuggestions;
            }
        }

        // 4. Cache miss: Thực hiện tính toán khớp cặp mới
        // Lấy tất cả các hồ sơ đang hoạt động khác đã KYC VERIFIED
        List<RoommateProfile> otherProfiles = profileRepository.findActiveProfilesForMatching(currentUser.getId());
        List<RoommateMatch> newMatches = new ArrayList<>();
        List<RoommateMatch> updatedMatches = new ArrayList<>();

        // Tải trước toàn bộ các bản ghi match hiện tại của myProfile để tối ưu truy vấn (tránh N+1)
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
                // Nếu bị Dismissed thì bỏ qua không xử lý tiếp
                if (existingMatch.getStatus() == MatchStatus.DISMISSED) {
                    continue;
                }
                // Nếu ở trạng thái khác, cập nhật lại điểm match mới dựa trên hồ sơ hiện tại
                BigDecimal newScore = matchingEngine.calculateMatchScore(myProfile, otherProfile);
                existingMatch.setMatchScore(newScore);
                updatedMatches.add(existingMatch);
            } else {
                // Tính điểm match mới
                BigDecimal score = matchingEngine.calculateMatchScore(myProfile, otherProfile);
                // Chỉ lưu các gợi ý có điểm khớp từ 50 trở lên
                if (score.compareTo(BigDecimal.valueOf(50)) >= 0) {
                    RoommateMatch match = RoommateMatch.builder()
                            .profileA(myProfile)
                            .profileB(otherProfile)
                            .matchScore(score)
                            .status(MatchStatus.SUGGESTED)
                            .createdAt(LocalDateTime.now())
                            .build();
                    newMatches.add(match);
                }
            }
        }

        if (!newMatches.isEmpty()) {
            matchRepository.saveAll(newMatches);
        }
        if (!updatedMatches.isEmpty()) {
            matchRepository.saveAll(updatedMatches);
        }

        // 5. Query lại từ database danh sách gợi ý chưa bị dismiss, sắp xếp theo điểm cao nhất
        List<RoommateMatch> suggestions = matchRepository.findSuggestions(myProfile.getId());
        
        // Giới hạn tối đa 10 gợi ý tốt nhất
        List<RoommateMatch> topSuggestions = suggestions.stream().limit(10).toList();

        // Map sang DTOs
        List<RoommateMatchResponse> responseList = topSuggestions.stream()
                .map(roommateMapper::toResponse)
                .toList();

        // 6. Lưu kết quả vào Redis Cache với thời hạn 1 giờ
        String serializedData = serializeSuggestions(responseList);
        if (serializedData != null) {
            redisTemplate.opsForValue().set(cacheKey, serializedData, CACHE_TTL_HOURS, TimeUnit.HOURS);
            log.info("Cached roommate suggestions in Redis for userId: {}", currentUser.getId());
        }

        return responseList;
    }

    @Override
    @Transactional
    public void dismissMatch(Long matchId, User currentUser) {
        RoommateMatch match = matchRepository.findById(matchId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin gợi ý"));

        // Đảm bảo user này có quyền dismiss match này (phải là profileA hoặc profileB của match)
        RoommateProfile myProfile = profileRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new BusinessException("Không tìm thấy hồ sơ ở ghép của bạn"));

        if (!match.getProfileA().getId().equals(myProfile.getId()) &&
            !match.getProfileB().getId().equals(myProfile.getId())) {
            throw new BusinessException("Bạn không có quyền từ chối gợi ý này");
        }

        // Đổi trạng thái sang DISMISSED
        match.setStatus(MatchStatus.DISMISSED);
        matchRepository.save(match);

        // Xoá cache gợi ý của cả hai người liên quan để cập nhật danh sách ngay lập tức
        evictSuggestionsCache(match.getProfileA().getUser().getId());
        evictSuggestionsCache(match.getProfileB().getUser().getId());
        log.info("Dismissed matchId: {} and evicted caches for users", matchId);
    }

    private void evictSuggestionsCache(Long userId) {
        String cacheKey = CACHE_PREFIX + userId;
        redisTemplate.delete(cacheKey);
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
