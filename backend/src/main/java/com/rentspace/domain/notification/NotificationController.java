package com.rentspace.domain.notification;

import com.rentspace.common.response.ApiResponse;
import com.rentspace.domain.notification.dto.NotificationResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import com.rentspace.domain.notification.enums.NotificationType;
import com.rentspace.common.exception.ResourceNotFoundException;
import java.util.List;

/**
 * Controller xử lý các REST API liên quan đến Thông báo.
 */
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notification API", description = "Các API phục vụ lấy danh sách thông báo và đánh dấu đã đọc")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @GetMapping
    @Operation(summary = "Lấy danh sách thông báo của người dùng hiện tại")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getMyNotifications(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<NotificationResponse> notifications = notificationService.getMyNotifications(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách thông báo thành công", notifications));
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "Đánh dấu một thông báo cụ thể là đã đọc")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        notificationService.markAsRead(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Đánh dấu đã đọc thành công", null));
    }

    @PutMapping("/read-all")
    @Operation(summary = "Đánh dấu toàn bộ thông báo là đã đọc")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @AuthenticationPrincipal UserDetails userDetails) {
        notificationService.markAllAsRead(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Đánh dấu đã đọc tất cả thành công", null));
    }

    @PostMapping("/test-send")
    @Operation(summary = "[TEST] Gửi thông báo test real-time cho chính mình")
    public ResponseEntity<ApiResponse<NotificationResponse>> sendTestNotification(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false, defaultValue = "Yêu cầu KYC được duyệt") String title,
            @RequestParam(required = false, defaultValue = "Tài khoản của bạn đã được nâng cấp lên Landlord thành công!") String content,
            @RequestParam(required = false, defaultValue = "KYC") String type) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User không tồn tại"));
        
        NotificationResponse response = notificationService.createAndSendNotification(
                user,
                title,
                content,
                NotificationType.valueOf(type)
        );
        return ResponseEntity.ok(ApiResponse.success("Gửi thông báo test thành công", response));
    }
}
