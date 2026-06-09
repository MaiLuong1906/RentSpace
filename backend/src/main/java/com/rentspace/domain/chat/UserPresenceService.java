package com.rentspace.domain.chat;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Dịch vụ theo dõi trạng thái online/offline của người dùng.
 * Theo dõi số lượng phiên kết nối (connection count) để tránh đánh dấu offline
 * khi người dùng vẫn còn tab khác đang mở.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserPresenceService {

    private final StringRedisTemplate redisTemplate;
    
    private static final String PRESENCE_KEY = "user:presence:connections";
    
    // Fallback cục bộ khi Redis không hoạt động
    private final Map<Long, Integer> localConnections = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        try {
            redisTemplate.delete(PRESENCE_KEY);
            log.info("Đã dọn dẹp các kết nối presence cũ trong Redis khi khởi động server");
        } catch (Exception e) {
            log.warn("Không thể dọn dẹp kết nối presence trong Redis khi khởi động: {}", e.getMessage());
        }
    }

    /**
     * Đánh dấu người dùng vừa kết nối thêm 1 phiên.
     *
     * @param userId ID của người dùng
     * @return true nếu người dùng chuyển từ trạng thái Offline sang Online (lần kết nối đầu tiên)
     */
    public boolean setOnline(Long userId) {
        try {
            Long count = redisTemplate.opsForHash().increment(PRESENCE_KEY, userId.toString(), 1);
            return count != null && count == 1;
        } catch (Exception e) {
            log.warn("Redis không khả dụng, sử dụng bộ nhớ cục bộ để đếm kết nối: {}", e.getMessage());
            final boolean[] justOnline = new boolean[1];
            localConnections.compute(userId, (k, val) -> {
                if (val == null) {
                    justOnline[0] = true;
                    return 1;
                }
                justOnline[0] = false;
                return val + 1;
            });
            return justOnline[0];
        }
    }

    /**
     * Đánh dấu người dùng vừa ngắt kết nối 1 phiên.
     *
     * @param userId ID của người dùng
     * @return true nếu người dùng chuyển từ trạng thái Online sang Offline (ngắt kết nối phiên cuối cùng)
     */
    public boolean setOffline(Long userId) {
        try {
            Long count = redisTemplate.opsForHash().increment(PRESENCE_KEY, userId.toString(), -1);
            if (count == null || count <= 0) {
                redisTemplate.opsForHash().delete(PRESENCE_KEY, userId.toString());
                return true;
            }
            return false;
        } catch (Exception e) {
            log.warn("Redis không khả dụng, sử dụng bộ nhớ cục bộ để đếm kết nối: {}", e.getMessage());
            final boolean[] justOffline = new boolean[1];
            localConnections.compute(userId, (k, val) -> {
                if (val == null || val <= 1) {
                    justOffline[0] = true;
                    return null;
                }
                justOffline[0] = false;
                return val - 1;
            });
            return justOffline[0];
        }
    }

    /**
     * Kiểm tra xem người dùng có đang online hay không.
     *
     * @param userId ID của người dùng
     * @return true nếu online, ngược lại false
     */
    public boolean isOnline(Long userId) {
        try {
            Object value = redisTemplate.opsForHash().get(PRESENCE_KEY, userId.toString());
            if (value != null) {
                int count = Integer.parseInt(value.toString());
                return count > 0;
            }
            return false;
        } catch (Exception e) {
            log.warn("Redis không khả dụng, đọc trạng thái presence từ bộ nhớ cục bộ: {}", e.getMessage());
            Integer count = localConnections.get(userId);
            return count != null && count > 0;
        }
    }
}
