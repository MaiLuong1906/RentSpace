package com.rentspace.domain.chat;

import org.springframework.security.access.AccessDeniedException;
import com.rentspace.common.response.ApiResponse;
import com.rentspace.domain.chat.dto.ConversationResponse;
import com.rentspace.domain.chat.dto.CreateConversationRequest;
import com.rentspace.domain.chat.dto.MessageResponse;
import com.rentspace.domain.user.CustomUserDetails;
import com.rentspace.domain.user.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller xử lý các REST API liên quan đến Chat.
 */
@RestController
@RequestMapping("/api/v1/conversations")
@RequiredArgsConstructor
@Tag(name = "Chat API", description = "Các API phục vụ nhắn tin thời gian thực giữa Tenant và Landlord")
public class ChatController {

    private final ChatService chatService;

    @GetMapping
    @Operation(summary = "Lấy danh sách các cuộc hội thoại của người dùng hiện tại")
    public ResponseEntity<ApiResponse<List<ConversationResponse>>> getConversations(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<ConversationResponse> conversations = chatService.getConversations(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách cuộc hội thoại thành công", conversations));
    }

    @GetMapping("/{id}/messages")
    @Operation(summary = "Lấy lịch sử tin nhắn phân trang của cuộc hội thoại")
    public ResponseEntity<ApiResponse<Page<MessageResponse>>> getMessages(
            @PathVariable Long id,
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal UserDetails userDetails) {
        Page<MessageResponse> messages = chatService.getMessages(id, userDetails.getUsername(), pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử tin nhắn thành công", messages));
    }

    @PostMapping
    @Operation(summary = "Khởi tạo cuộc hội thoại mới giữa Tenant và Landlord")
    public ResponseEntity<ApiResponse<ConversationResponse>> createConversation(
            @Valid @RequestBody CreateConversationRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        // Pattern matching instanceof để tránh ClassCastException runtime khi userDetails không phải CustomUserDetails
        if (!(userDetails instanceof CustomUserDetails currentUser)) {
            throw new AccessDeniedException("Không thể xác định danh tính người dùng.");
        }

        Conversation conversation = chatService.getOrCreateConversation(
                currentUser.getUser().getId(),
                request.getLandlordId()
        );

        User otherParticipant = conversation.getTenant().getId().equals(currentUser.getUser().getId())
                ? conversation.getLandlord() : conversation.getTenant();

        ConversationResponse response = ConversationResponse.builder()
                .id(conversation.getId())
                .otherParticipantId(otherParticipant.getId())
                .otherParticipantName(otherParticipant.getFullName())
                .otherParticipantAvatar(otherParticipant.getAvatarUrl())
                .unreadCount(0L)
                .build();

        return ResponseEntity.ok(ApiResponse.success("Tạo cuộc hội thoại thành công", response));
    }
}
