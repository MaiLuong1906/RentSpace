package com.rentspace.common.ratelimit;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service quản lý việc tạo và lưu trữ các Bucket (bộ đếm giới hạn tần suất) của Bucket4j.
 */
@Service
public class RateLimitingService {

    // Cache lưu trữ các bucket tương ứng với từng Client Key (IP hoặc Username + Endpoint)
    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    /**
     * Lấy hoặc khởi tạo Bucket cho một key cụ thể dựa trên cấu hình capacity và duration.
     *
     * @param key khóa định danh client và API (ví dụ: ip:127.0.0.1:/api/v1/reports)
     * @param capacity số lượng request tối đa
     * @param durationInSeconds thời gian hồi phục toàn bộ token (giây)
     * @return đối tượng Bucket của Bucket4j
     */
    public Bucket resolveBucket(String key, int capacity, int durationInSeconds) {
        return cache.computeIfAbsent(key, k -> Bucket.builder()
                .addLimit(Bandwidth.classic(capacity, 
                        Refill.intervally(capacity, Duration.ofSeconds(durationInSeconds))))
                .build());
    }
}
