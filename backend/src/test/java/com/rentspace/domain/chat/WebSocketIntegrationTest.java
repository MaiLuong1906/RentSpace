package com.rentspace.domain.chat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.rentspace.domain.chat.dto.ChatMessageRequest;
import com.rentspace.domain.chat.dto.ChatMessageResponse;
import com.rentspace.domain.user.CustomUserDetails;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import com.rentspace.domain.user.enums.KycStatus;
import com.rentspace.domain.user.enums.Role;
import com.rentspace.infrastructure.security.JwtTokenProvider;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

import java.lang.reflect.Type;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;

import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Slf4j
public class WebSocketIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User sender;
    private User receiver;
    private String senderToken;
    private WebSocketStompClient stompClient;

    @BeforeEach
    void setUp() {
        messageRepository.deleteAll();
        conversationRepository.deleteAll();
        userRepository.deleteAll();

        // Tạo người gửi (Sender) với vai trò TENANT
        sender = User.builder()
                .email("sender_" + UUID.randomUUID() + "@example.com")
                .password("password123")
                .fullName("Sender Name")
                .role(Role.TENANT)
                .kycStatus(KycStatus.VERIFIED)
                .isActive(true)
                .isEmailVerified(true)
                .build();
        sender = userRepository.save(sender);

        // Tạo người nhận (Receiver) với vai trò LANDLORD
        receiver = User.builder()
                .email("receiver_" + UUID.randomUUID() + "@example.com")
                .password("password123")
                .fullName("Receiver Name")
                .role(Role.LANDLORD)
                .kycStatus(KycStatus.VERIFIED)
                .isActive(true)
                .isEmailVerified(true)
                .build();
        receiver = userRepository.save(receiver);

        // Tạo access token hợp lệ cho sender
        CustomUserDetails userDetails = new CustomUserDetails(sender);
        senderToken = jwtTokenProvider.generateAccessToken(userDetails);

        // Cấu hình ObjectMapper hỗ trợ LocalDateTime (Java 8 Date/Time)
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        MappingJackson2MessageConverter converter = new MappingJackson2MessageConverter();
        converter.setObjectMapper(objectMapper);

        stompClient = new WebSocketStompClient(new StandardWebSocketClient());
        stompClient.setMessageConverter(converter);
    }

    @AfterEach
    void tearDown() {
        messageRepository.deleteAll();
        conversationRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void testWebSocketConnectionAndMessageFlow() throws Exception {
        String wsUrl = "ws://localhost:" + port + "/ws/websocket";

        StompHeaders connectHeaders = new StompHeaders();
        connectHeaders.add("Authorization", "Bearer " + senderToken);

        CompletableFuture<StompSession> sessionFuture = stompClient.connectAsync(
                wsUrl,
                new WebSocketHttpHeaders(),
                connectHeaders,
                new StompSessionHandlerAdapter() {
                    @Override
                    public void handleException(StompSession session, StompCommand command, StompHeaders headers, byte[] payload, Throwable exception) {
                        log.error("STOMP Exception: {}", exception.getMessage(), exception);
                    }

                    @Override
                    public void handleTransportError(StompSession session, Throwable exception) {
                        log.error("STOMP Transport Error: {}", exception.getMessage(), exception);
                    }
                }
        );

        StompSession session = sessionFuture.get(10, TimeUnit.SECONDS);
        assertTrue(session.isConnected(), "Kết nối WebSocket thành công");

        BlockingQueue<ChatMessageResponse> blockingQueue = new LinkedBlockingQueue<>();
        session.subscribe("/user/queue/messages", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return ChatMessageResponse.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                log.info("Nhận được frame từ WebSocket: {}", payload);
                blockingQueue.offer((ChatMessageResponse) payload);
            }
        });

        // Tạo nội dung tin nhắn gửi tới /app/chat.send
        ChatMessageRequest request = ChatMessageRequest.builder()
                .receiverId(receiver.getId())
                .content("Hello integration test!")
                .messageType("TEXT")
                .build();

        session.send("/app/chat.send", request);

        // Chờ nhận tin nhắn phản hồi
        ChatMessageResponse receivedMsg = blockingQueue.poll(10, TimeUnit.SECONDS);
        assertNotNull(receivedMsg, "Không nhận được phản hồi từ WebSocket (null)");
        assertEquals("Hello integration test!", receivedMsg.getContent());
        assertEquals(sender.getId(), receivedMsg.getSenderId());
        assertEquals(receiver.getId(), receivedMsg.getReceiverId());

        // Kiểm tra dữ liệu trong database
        long deadline = System.currentTimeMillis() + 5000;
        List<Message> dbMessages = List.of();
        while (System.currentTimeMillis() < deadline) {
            dbMessages = messageRepository.findAll();
            if (!dbMessages.isEmpty()) {
                break;
            }
            Thread.sleep(100);
        }

        assertFalse(dbMessages.isEmpty(), "Tin nhắn phải được lưu vào Database");
        Message savedMessage = dbMessages.get(0);
        assertEquals("Hello integration test!", savedMessage.getContent());
        assertEquals(sender.getId(), savedMessage.getSender().getId());
    }
}
