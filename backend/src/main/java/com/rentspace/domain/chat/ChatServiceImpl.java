package com.rentspace.domain.chat;

import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.common.exception.BusinessException;
import org.springframework.security.access.AccessDeniedException;
import com.rentspace.domain.chat.dto.ConversationResponse;
import com.rentspace.domain.chat.dto.MessageResponse;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import com.rentspace.domain.chat.UserPresenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigInteger;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;


/**
 * Hiện thực hóa ChatService.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChatServiceImpl implements ChatService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserPresenceService presenceService;

    @Override
    @Transactional
    public Conversation getOrCreateConversation(Long tenantId, Long landlordId) {
        if (tenantId.equals(landlordId)) {
            throw new BusinessException("Không thể tạo cuộc hội thoại với chính mình");
        }
        
        // Tìm kiếm cuộc hội thoại đã tồn tại ở cả 2 chiều
        return conversationRepository.findConversationBetween(tenantId, landlordId)
                .orElseGet(() -> {
                    // Luôn quy ước tenantId là ID nhỏ hơn, landlordId là ID lớn hơn để giữ unique constraint trong DB
                    Long firstId = Math.min(tenantId, landlordId);
                    Long secondId = Math.max(tenantId, landlordId);

                    User tenant = userRepository.findById(firstId)
                            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng: " + firstId));
                    User landlord = userRepository.findById(secondId)
                            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng: " + secondId));

                    Conversation conversation = Conversation.builder()
                            .tenant(tenant)
                            .landlord(landlord)
                            .build();

                    log.info("Tạo cuộc trò chuyện mới giữa User ID {} và User ID {}", firstId, secondId);
                    try {
                        return conversationRepository.save(conversation);
                    } catch (org.springframework.dao.DataIntegrityViolationException e) {
                        log.warn("Cuộc trò chuyện giữa {} và {} đã được tạo song song, quay lại tìm kiếm", tenantId, landlordId);
                        return conversationRepository.findConversationBetween(tenantId, landlordId)
                                .orElseThrow(() -> new BusinessException("Không thể khởi tạo cuộc hội thoại"));
                    }
                });
    }

    @Override
    @Async
    @Transactional
    public CompletableFuture<Message> saveMessageAsync(Long conversationId, Long senderId, String content, String messageType, String fileUrl) {
        long startTime = System.currentTimeMillis();
 
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cuộc hội thoại: " + conversationId));
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người gửi: " + senderId));
 
        com.rentspace.domain.chat.enums.MessageType type = com.rentspace.domain.chat.enums.MessageType.TEXT;
        if (messageType != null) {
            try {
                type = com.rentspace.domain.chat.enums.MessageType.valueOf(messageType.toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Không khớp MessageType {}, mặc định dùng TEXT", messageType);
            }
        }
 
        Message message = Message.builder()
                .conversation(conversation)
                .sender(sender)
                .content(content)
                .messageType(type)
                .fileUrl(fileUrl)
                .isRead(false)
                .build();

        Message saved = messageRepository.save(message);

        // Cập nhật mốc thời gian hoạt động mới nhất của cuộc hội thoại để sắp xếp
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        log.info("Lưu tin nhắn thành công không đồng bộ (Thread: {}) trong {} ms",
                Thread.currentThread().getName(), (System.currentTimeMillis() - startTime));

        return CompletableFuture.completedFuture(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConversationResponse> getConversations(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User không tồn tại"));

        // Dùng native summary query để lấy toàn bộ thông tin trong 1 query (tránh N+1)
        List<Object[]> rows = conversationRepository.findConversationSummariesByUserId(user.getId());

        return rows.stream().map(row -> {
            Long conversationId = row[0] != null ? ((Number) row[0]).longValue() : null;
            Long otherUserId    = row[1] != null ? ((Number) row[1]).longValue() : null;
            String otherName    = (String) row[2];
            String otherAvatar  = (String) row[3];
            String lastMessage  = (String) row[4];
            LocalDateTime lastMessageTime = null;
            if (row[5] != null) {
                if (row[5] instanceof java.sql.Timestamp ts) {
                    lastMessageTime = ts.toLocalDateTime();
                } else if (row[5] instanceof java.time.LocalDateTime ldt) {
                    lastMessageTime = ldt;
                }
            }
            Long unreadCount = row[6] != null ? ((Number) row[6]).longValue() : 0L;

            return ConversationResponse.builder()
                    .id(conversationId)
                    .otherParticipantId(otherUserId)
                    .otherParticipantName(otherName)
                    .otherParticipantAvatar(otherAvatar)
                    .lastMessage(lastMessage != null ? lastMessage : "")
                    .lastMessageTime(lastMessageTime)
                    .unreadCount(unreadCount)
                    .isOnline(presenceService.isOnline(otherUserId))
                    .build();
        }).collect(Collectors.toList());
    }


    @Override
    @Transactional
    public Page<MessageResponse> getMessages(Long conversationId, String email, Pageable pageable) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User không tồn tại"));

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cuộc hội thoại: " + conversationId));

        // Kiểm tra quyền truy cập (phải là tenant hoặc landlord của cuộc hội thoại)
        if (!conversation.getTenant().getId().equals(user.getId()) && !conversation.getLandlord().getId().equals(user.getId())) {
            throw new AccessDeniedException("Bạn không có quyền xem cuộc trò chuyện này");
        }

        // Đánh dấu toàn bộ tin nhắn nhận được là đã đọc
        messageRepository.markMessagesAsRead(conversationId, user.getId());

        // Phát tín hiệu "Đã xem" (Seen) qua WebSocket cho đối phương
        User otherParticipant = conversation.getTenant().getId().equals(user.getId())
                ? conversation.getLandlord() : conversation.getTenant();
        try {
            messagingTemplate.convertAndSendToUser(
                    otherParticipant.getId().toString(),
                    "/queue/messages.read",
                    Map.of("conversationId", conversationId, "readerId", user.getId())
            );
            log.info("Gửi WebSocket báo đã xem cuộc hội thoại {} tới user ID {}", conversationId, otherParticipant.getId());
        } catch (Exception e) {
            log.error("Lỗi khi gửi WebSocket báo đã xem: {}", e.getMessage());
        }

        // Lấy lịch sử tin nhắn
        Page<Message> messages = messageRepository.findByConversationIdOrderByCreatedAtDesc(conversationId, pageable);

        return messages.map(m -> MessageResponse.builder()
                .id(m.getId())
                .conversationId(m.getConversation().getId())
                .senderId(m.getSender().getId())
                .content(m.getContent())
                .isOwn(m.getSender().getId().equals(user.getId()))
                .isRead(m.getIsRead())
                .messageType(m.getMessageType().name())
                .fileUrl(m.getFileUrl())
                .createdAt(m.getCreatedAt())
                .build());
    }

    @Override
    @Transactional
    public void markConversationAsRead(Long conversationId, Long userId) {
        messageRepository.markMessagesAsRead(conversationId, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public Conversation getConversationById(Long id) {
        return conversationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cuộc hội thoại: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public Long getOtherParticipantId(Long conversationId, Long currentUserId) {
        Conversation conversation = getConversationById(conversationId);
        return conversation.getTenant().getId().equals(currentUserId)
                ? conversation.getLandlord().getId()
                : conversation.getTenant().getId();
    }

    @Override
    public boolean isUserOnline(Long userId) {
        return presenceService.isOnline(userId);
    }
}
