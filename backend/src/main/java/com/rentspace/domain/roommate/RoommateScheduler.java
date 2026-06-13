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
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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
     * Chạy định kỳ 12 giờ một lần (lúc 8:00 và 20:00 hàng ngày)
     * Cron format: "0 0 8,20 * * *"
     */
    @Scheduled(cron = "0 0 8,20 * * *")
    @Transactional
    public void runRoommateMatchingJob() {
        log.info("Starting scheduled Roommate Matching Job at {}", LocalDateTime.now());

        // 1. Lấy tất cả các hồ sơ ở ghép đang hoạt động và đã xác thực KYC
        List<RoommateProfile> activeProfiles = profileRepository.findAllActiveProfiles();
        if (activeProfiles.size() < 2) {
            log.info("Not enough active roommate profiles for matching. Total active: {}", activeProfiles.size());
            return;
        }

        // Map lưu trữ số lượng gợi ý mới >= 80% của mỗi người dùng
        Map<User, Integer> newMatchCounts = new HashMap<>();

        // 2. So khớp cặp chéo (N * (N-1) / 2)
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
                    // Nếu đã bị dismiss thì bỏ qua hoàn toàn
                    if (existingMatch.getStatus() == MatchStatus.DISMISSED) {
                        continue;
                    }

                    // Ngược lại, cập nhật điểm số tương hợp mới nhất
                    BigDecimal newScore = matchingEngine.calculateMatchScore(profileA, profileB);
                    existingMatch.setMatchScore(newScore);
                    updatedMatches.add(existingMatch);
                } else {
                    // Chưa có bản ghi, tính điểm tương hợp mới
                    BigDecimal score = matchingEngine.calculateMatchScore(profileA, profileB);

                    // Chỉ lưu các gợi ý có điểm khớp từ 50 trở lên
                    if (score.compareTo(BigDecimal.valueOf(50)) >= 0) {
                        RoommateMatch match = RoommateMatch.builder()
                                .profileA(profileA)
                                .profileB(profileB)
                                .matchScore(score)
                                .status(MatchStatus.SUGGESTED)
                                .createdAt(LocalDateTime.now())
                                .build();
                        newMatches.add(match);

                        // Nếu điểm tương hợp cao (>= 80%), tăng biến đếm để gửi thông báo
                        if (score.compareTo(BigDecimal.valueOf(80)) >= 0) {
                            newMatchCounts.put(profileA.getUser(), newMatchCounts.getOrDefault(profileA.getUser(), 0) + 1);
                            newMatchCounts.put(profileB.getUser(), newMatchCounts.getOrDefault(profileB.getUser(), 0) + 1);
                        }
                    }
                }
            }
        }

        if (!newMatches.isEmpty()) {
            matchRepository.saveAll(newMatches);
        }
        if (!updatedMatches.isEmpty()) {
            matchRepository.saveAll(updatedMatches);
        }

        // 3. Gửi thông báo tổng hợp và xóa cache cho người dùng có gợi ý mới phù hợp cao
        for (Map.Entry<User, Integer> entry : newMatchCounts.entrySet()) {
            User user = entry.getKey();
            int count = entry.getValue();

            if (count > 0) {
                // Xóa cache gợi ý của user để danh sách gợi ý mới tự động nạp từ DB ở lần truy vấn kế tiếp
                String cacheKey = CACHE_PREFIX + user.getId();
                redisTemplate.delete(cacheKey);

                try {
                    // Gửi thông báo hệ thống thời gian thực
                    notificationService.createAndSendNotification(
                            user,
                            "Gợi ý ghép phòng mới",
                            String.format("Hệ thống đã tìm thấy %d bạn ở ghép mới phù hợp hơn 80%% với phong cách sống của bạn!", count),
                            NotificationType.ROOMMATE
                    );
                    log.info("Sent roommate match notification to user: {} (email: {})", user.getFullName(), user.getEmail());
                } catch (Exception e) {
                    log.error("Failed to send roommate matching notification to user: {}", user.getEmail(), e);
                }
            }
        }

        log.info("Finished Roommate Matching Job successfully at {}", LocalDateTime.now());
    }
}
