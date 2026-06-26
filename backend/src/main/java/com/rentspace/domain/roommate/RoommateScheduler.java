package com.rentspace.domain.roommate;

import com.rentspace.domain.notification.NotificationService;
import com.rentspace.domain.notification.enums.NotificationType;
import com.rentspace.domain.roommate.enums.MatchStatus;
import com.rentspace.domain.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class RoommateScheduler {

    private final RoommateProfileRepository profileRepository;
    private final RoommateMatchRepository matchRepository;
    private final RoommateMatchingEngine matchingEngine;
    private final NotificationService notificationService;
    private final StringRedisTemplate redisTemplate;

    private static final String CACHE_PREFIX = "roommate:suggestions:";

    /**
     * Chạy định kỳ 12 giờ một lần (lúc 8:00 và 20:00 hàng ngày).
     * Tính lại điểm tương hợp và gửi thông báo cho các cặp mới >= 80%.
     */
    @Scheduled(cron = "0 0 8,20 * * *")
    @Transactional
    public void runRoommateMatchingJob() {
        log.info("Starting scheduled Roommate Matching Job at {}", LocalDateTime.now());

        List<RoommateProfile> activeProfiles = profileRepository.findAllActiveProfiles();
        if (activeProfiles.size() < 2) {
            log.info("Not enough active roommate profiles for matching. Total active: {}", activeProfiles.size());
            return;
        }

        Map<User, Integer> newMatchCounts = new HashMap<>();

        List<RoommateMatch> allMatches = matchRepository.findAll();
        Map<String, RoommateMatch> matchMap = new HashMap<>();
        for (RoommateMatch m : allMatches) {
            long id1 = m.getProfileA().getId();
            long id2 = m.getProfileB().getId();
            String key = id1 < id2 ? id1 + ":" + id2 : id2 + ":" + id1;
            matchMap.put(key, m);
        }

        List<RoommateMatch> newMatches = new java.util.ArrayList<>();
        List<RoommateMatch> updatedMatches = new java.util.ArrayList<>();

        for (int i = 0; i < activeProfiles.size(); i++) {
            RoommateProfile profileA = activeProfiles.get(i);

            for (int j = i + 1; j < activeProfiles.size(); j++) {
                RoommateProfile profileB = activeProfiles.get(j);

                long id1 = profileA.getId();
                long id2 = profileB.getId();
                String key = id1 < id2 ? id1 + ":" + id2 : id2 + ":" + id1;
                RoommateMatch existingMatch = matchMap.get(key);

                if (existingMatch != null) {
                    if (existingMatch.getStatus() == MatchStatus.DISMISSED) {
                        continue;
                    }
                    BigDecimal newScore = matchingEngine.calculateMatchScore(profileA, profileB);
                    existingMatch.setMatchScore(newScore);
                    updatedMatches.add(existingMatch);
                } else {
                    BigDecimal score = matchingEngine.calculateMatchScore(profileA, profileB);

                    if (score.compareTo(BigDecimal.valueOf(50)) >= 0) {
                        RoommateMatch match = RoommateMatch.builder()
                                .profileA(profileA)
                                .profileB(profileB)
                                .matchScore(score)
                                .status(MatchStatus.SUGGESTED)
                                .build();
                        newMatches.add(match);

                        if (score.compareTo(BigDecimal.valueOf(80)) >= 0) {
                            newMatchCounts.put(profileA.getUser(), newMatchCounts.getOrDefault(profileA.getUser(), 0) + 1);
                            newMatchCounts.put(profileB.getUser(), newMatchCounts.getOrDefault(profileB.getUser(), 0) + 1);
                        }
                    }
                }
            }
        }

        if (!newMatches.isEmpty()) matchRepository.saveAll(newMatches);
        if (!updatedMatches.isEmpty()) matchRepository.saveAll(updatedMatches);

        for (Map.Entry<User, Integer> entry : newMatchCounts.entrySet()) {
            User user = entry.getKey();
            int count = entry.getValue();

            if (count > 0) {
                redisTemplate.delete(CACHE_PREFIX + user.getId());
                try {
                    notificationService.createAndSendNotification(
                            user,
                            "Gợi ý ghép phòng mới",
                            String.format("Hệ thống đã tìm thấy %d bạn ở ghép mới phù hợp hơn 80%% với phong cách sống của bạn!", count),
                            NotificationType.ROOMMATE
                    );
                } catch (Exception e) {
                    log.error("Failed to send roommate matching notification to user: {}", user.getEmail(), e);
                }
            }
        }

        log.info("Finished Roommate Matching Job at {}", LocalDateTime.now());
    }

    /**
     * Chạy mỗi ngày lúc 00:05 — tự động ẩn các hồ sơ đã quá ngày dự kiến chuyển vào/trống phòng.
     */
    @Scheduled(cron = "0 5 0 * * *")
    @Transactional
    public void deactivateExpiredProfiles() {
        LocalDate today = LocalDate.now();
        List<RoommateProfile> expiredProfiles = profileRepository.findExpiredActiveProfiles(today);

        if (expiredProfiles.isEmpty()) {
            return;
        }

        for (RoommateProfile profile : expiredProfiles) {
            profile.setIsActive(false);
            redisTemplate.delete(CACHE_PREFIX + profile.getUser().getId());
        }
        profileRepository.saveAll(expiredProfiles);

        log.info("Deactivated {} expired roommate profiles (moveInDate < {})", expiredProfiles.size(), today);
    }
}
