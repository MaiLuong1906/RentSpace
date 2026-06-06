package com.rentspace.common.ratelimit;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation dùng để đánh dấu giới hạn tần suất (Rate Limiting) trên các API endpoint.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimit {
    // Số request tối đa được phép thực hiện trong khoảng thời gian durationInSeconds
    int capacity() default 5;

    // Khoảng thời gian tính bằng giây để hồi lượng token (reset rate limit)
    int durationInSeconds() default 60;
}
