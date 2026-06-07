package com.rentspace.domain.chat;

import com.rentspace.domain.chat.dto.ConversationResponse;
import com.rentspace.domain.chat.dto.MessageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.concurrent.CompletableFuture;

/**
 * Service quản lý cuộc hội thoại và tin nhắn chat.
 */
public interface ChatService {

    /**
     * Lấy cuộc hội thoại hiện tại hoặc tạo mới nếu chưa tồn tại giữa Tenant và Landlord.
     */
    Conversation getOrCreateConversation(Long tenantId, Long landlordId);

    /**
     * Lưu tin nhắn vào cơ sở dữ liệu một cách không đồng bộ.
     */
    CompletableFuture<Message> saveMessageAsync(Long conversationId, Long senderId, String content, String messageType, String fileUrl);

    /**
     * Lấy danh sách toàn bộ cuộc hội thoại của người dùng đang đăng nhập.
     */
    List<ConversationResponse> getConversations(String email);

    /**
     * Lấy lịch sử tin nhắn phân trang của cuộc hội thoại.
     */
    Page<MessageResponse> getMessages(Long conversationId, String email, Pageable pageable);

    /**
     * Đánh dấu toàn bộ tin nhắn trong cuộc hội thoại là đã đọc đối với một người dùng cụ thể.
     */
    void markConversationAsRead(Long conversationId, Long userId);

    /**
     * Lấy thông tin cuộc hội thoại theo ID.
     */
    Conversation getConversationById(Long id);

    /**
     * Lấy ID của đối phương trong cuộc hội thoại để gửi WebSocket an toàn (tránh LazyInitializationException).
     */
    Long getOtherParticipantId(Long conversationId, Long currentUserId);
}
