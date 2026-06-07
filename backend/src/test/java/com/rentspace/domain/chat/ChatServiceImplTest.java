package com.rentspace.domain.chat;

import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.domain.chat.dto.ConversationResponse;
import com.rentspace.domain.chat.dto.MessageResponse;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigInteger;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatServiceImplTest {

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private UserRepository userRepository;

    // Mock SimpMessagingTemplate để tránh NullPointerException trong getMessages()
    // khi service gửi tín hiệu "Đã xem" qua WebSocket
    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private ChatServiceImpl chatService;

    private User tenant;
    private User landlord;
    private Conversation conversation;

    @BeforeEach
    void setUp() {
        tenant = User.builder()
                .id(1L)
                .email("tenant@rentspace.com")
                .fullName("Tenant User")
                .build();

        landlord = User.builder()
                .id(2L)
                .email("landlord@rentspace.com")
                .fullName("Landlord User")
                .build();

        conversation = Conversation.builder()
                .id(100L)
                .tenant(tenant)
                .landlord(landlord)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    void getOrCreateConversation_WhenExists_ShouldReturnExisting() {
        // Given
        when(conversationRepository.findByTenantIdAndLandlordId(1L, 2L))
                .thenReturn(Optional.of(conversation));

        // When
        Conversation result = chatService.getOrCreateConversation(1L, 2L);

        // Then
        assertNotNull(result);
        assertEquals(100L, result.getId());
        verify(conversationRepository, never()).save(any(Conversation.class));
    }

    @Test
    void getOrCreateConversation_WhenNotExists_ShouldCreateAndSave() {
        // Given
        when(conversationRepository.findByTenantIdAndLandlordId(1L, 2L))
                .thenReturn(Optional.empty());
        when(userRepository.findById(1L)).thenReturn(Optional.of(tenant));
        when(userRepository.findById(2L)).thenReturn(Optional.of(landlord));
        when(conversationRepository.save(any(Conversation.class))).thenReturn(conversation);

        // When
        Conversation result = chatService.getOrCreateConversation(1L, 2L);

        // Then
        assertNotNull(result);
        verify(conversationRepository, times(1)).save(any(Conversation.class));
    }

    @Test
    void getOrCreateConversation_WithSameId_ShouldThrowException() {
        // When & Then
        assertThrows(IllegalArgumentException.class, () ->
                chatService.getOrCreateConversation(1L, 1L)
        );
    }

    @Test
    void saveMessageAsync_ShouldSaveAndReturnFuture() throws Exception {
        // Given
        when(conversationRepository.findById(100L)).thenReturn(Optional.of(conversation));
        when(userRepository.findById(1L)).thenReturn(Optional.of(tenant));

        Message mockMessage = Message.builder()
                .id(500L)
                .conversation(conversation)
                .sender(tenant)
                .content("Hello Landlord")
                .isRead(false)
                .build();

        when(messageRepository.save(any(Message.class))).thenReturn(mockMessage);

        // When
        CompletableFuture<Message> future = chatService.saveMessageAsync(100L, 1L, "Hello Landlord", "TEXT", null);

        // Then
        assertNotNull(future);
        Message saved = future.get();
        assertEquals(500L, saved.getId());
        assertEquals("Hello Landlord", saved.getContent());
        verify(messageRepository, times(1)).save(any(Message.class));
        verify(conversationRepository, times(1)).save(conversation);
    }

    @Test
    void getConversations_ShouldReturnMappedResponse() {
        // Given
        when(userRepository.findByEmail("tenant@rentspace.com")).thenReturn(Optional.of(tenant));
        
        Object[] mockRow = new Object[] {
                BigInteger.valueOf(100L),                  // conversationId
                BigInteger.valueOf(2L),                    // otherUserId
                "Landlord User",                           // otherUserFullName
                "landlord_avatar.png",                     // otherUserAvatarUrl
                "Last Message",                            // lastMessageContent
                Timestamp.valueOf(LocalDateTime.now()),    // lastMessageTime
                BigInteger.valueOf(3L)                     // unreadCount
        };
        
        when(conversationRepository.findConversationSummariesByUserId(1L))
                .thenReturn(Collections.singletonList(mockRow));

        // When
        List<ConversationResponse> results = chatService.getConversations("tenant@rentspace.com");

        // Then
        assertNotNull(results);
        assertEquals(1, results.size());
        ConversationResponse response = results.get(0);
        assertEquals(100L, response.getId());
        assertEquals("Last Message", response.getLastMessage());
        assertEquals(3L, response.getUnreadCount());
        assertEquals(2L, response.getOtherParticipantId());
    }

    @Test
    void getMessages_WhenAuthorized_ShouldReturnMessagesAndMarkAsRead() {
        // Given
        when(userRepository.findByEmail("tenant@rentspace.com")).thenReturn(Optional.of(tenant));
        when(conversationRepository.findById(100L)).thenReturn(Optional.of(conversation));
        
        Message msg = Message.builder()
                .id(500L)
                .conversation(conversation)
                .sender(landlord)
                .content("Hi")
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
        
        Pageable pageable = PageRequest.of(0, 10);
        Page<Message> msgPage = new PageImpl<>(Collections.singletonList(msg), pageable, 1);
        
        when(messageRepository.findByConversationIdOrderByCreatedAtDesc(100L, pageable))
                .thenReturn(msgPage);

        // When
        Page<MessageResponse> results = chatService.getMessages(100L, "tenant@rentspace.com", pageable);

        // Then
        assertNotNull(results);
        assertEquals(1, results.getTotalElements());
        MessageResponse response = results.getContent().get(0);
        assertEquals("Hi", response.getContent());
        assertFalse(response.getIsOwn()); // Sent by landlord, viewed by tenant
        
        // Verify mark as read được gọi
        verify(messageRepository, times(1)).markMessagesAsRead(100L, 1L);
        // Verify WebSocket "seen" signal được gửi tới đối phương (landlord id=2)
        verify(messagingTemplate, times(1)).convertAndSendToUser(
                eq("2"), eq("/queue/messages.read"), any()
        );
    }

    @Test
    void getMessages_WhenUnauthorized_ShouldThrowAccessDeniedException() {
        // Given
        User otherUser = User.builder().id(99L).email("hacker@rentspace.com").build();
        when(userRepository.findByEmail("hacker@rentspace.com")).thenReturn(Optional.of(otherUser));
        when(conversationRepository.findById(100L)).thenReturn(Optional.of(conversation));

        // When & Then
        assertThrows(AccessDeniedException.class, () ->
                chatService.getMessages(100L, "hacker@rentspace.com", PageRequest.of(0, 10))
        );
    }
}
