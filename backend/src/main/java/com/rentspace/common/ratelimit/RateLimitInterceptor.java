package com.rentspace.common.ratelimit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rentspace.common.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;

/**
 * Interceptor kiểm tra giới hạn tần suất gửi yêu cầu lên hệ thống.
 * Nếu client vượt quá giới hạn, trả về HTTP status 429 (Too Many Requests).
 */
@Component
@RequiredArgsConstructor
public class RateLimitInterceptor implements HandlerInterceptor {

    private final RateLimitingService rateLimitingService;
    private final ObjectMapper objectMapper;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // Chỉ áp dụng rate limit cho các Spring MVC controller method handler
        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return true;
        }

        // Kiểm tra xem method của controller có cấu hình @RateLimit không
        RateLimit rateLimit = handlerMethod.getMethodAnnotation(RateLimit.class);
        if (rateLimit == null) {
            return true;
        }

        // Định danh Client (bằng Email/Username nếu đã đăng nhập hoặc IP nếu là guest)
        String clientKey = resolveClientKey(request);
        String rateLimitKey = clientKey + ":" + request.getRequestURI();

        var bucket = rateLimitingService.resolveBucket(rateLimitKey, rateLimit.capacity(), rateLimit.durationInSeconds());

        // Thử tiêu thụ 1 token trong bucket
        if (!bucket.tryConsume(1)) {
            sendRateLimitExceededResponse(response);
            return false; // Chặn request không cho đi tiếp vào Controller
        }

        return true;
    }

    /**
     * Xác định định danh khách hàng dựa trên authentication hoặc địa chỉ IP.
     */
    private String resolveClientKey(HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return "user:" + auth.getName();
        }

        // Lấy IP từ X-Forwarded-For đề phòng qua proxy/load balancer
        String ipAddress = request.getHeader("X-Forwarded-For");
        if (ipAddress == null || ipAddress.isEmpty()) {
            ipAddress = request.getRemoteAddr();
        }
        return "ip:" + ipAddress;
    }

    /**
     * Trả về JSON thông báo lỗi 429 Too Many Requests theo chuẩn ApiResponse.
     */
    private void sendRateLimitExceededResponse(HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        ApiResponse<Void> apiResponse = ApiResponse.error("Bạn đã gửi yêu cầu quá nhanh. Vui lòng thử lại sau.");
        response.getWriter().write(objectMapper.writeValueAsString(apiResponse));
    }
}
