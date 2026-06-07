package com.rentspace.domain.notification;

import com.rentspace.domain.notification.dto.NotificationResponse;
import com.rentspace.domain.notification.enums.NotificationType;
import com.rentspace.domain.user.User;

import java.util.List;

/**
 * Service quản lý và gửi thông báo thời gian thực.
 */
public interface NotificationService {
    
    /**
     * Tạo thông báo mới, lưu vào cơ sở dữ liệu và đẩy qua WebSocket.
     */
    NotificationResponse createAndSendNotification(User user, String title, String content, NotificationType type);

    /**
     * Lấy danh sách thông báo của người dùng đang đăng nhập.
     */
    List<NotificationResponse> getMyNotifications(String email);

    /**
     * Đánh dấu thông báo là đã đọc.
     */
    void markAsRead(Long notificationId, String email);

    /**
     * Đánh dấu tất cả thông báo của người dùng hiện tại là đã đọc.
     */
    void markAllAsRead(String email);
}
