"use client";

import { useEffect, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/store/chatStore";
import { toast } from "sonner";
import { chatApi } from "@/lib/api/chat";

// Singleton STOMP client & reference counter
let sharedStompClient: Client | null = null;
let activeHookCount = 0;

export function useChat() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const router = useRouter();

  // Sử dụng selector để tránh re-render không cần thiết khi state của chatStore thay đổi
  const setConnected = useChatStore((state) => state.setConnected);
  const addMessage = useChatStore((state) => state.addMessage);

  useEffect(() => {
    if (!token) return;

    activeHookCount++;

    if (!sharedStompClient) {
      sharedStompClient = new Client({
        webSocketFactory: () =>
          new SockJS(`${process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "")}/ws`),
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        onConnect: () => {
          setConnected(true);

          // 1. Subscribe to personal messages
          sharedStompClient?.subscribe("/user/queue/messages", (frame) => {
            try {
              const message = JSON.parse(frame.body);
              
              // Cập nhật tin nhắn vào store, dedup theo message.id
              addMessage(message.conversationId, message);

              const store = useChatStore.getState();
              
              // Nếu người dùng không ở trong phòng chat nhận tin nhắn
              if (store.activeConversationId !== message.conversationId) {
                const conv = store.conversations.find((c) => c.id === message.conversationId);
                
                if (conv) {
                  const avatar = conv.otherParticipantAvatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${conv.otherParticipantName}`;
                  let tId: string | number;
                  tId = toast(
                    <div 
                      className="flex items-center gap-3 cursor-pointer py-1.5 w-full active:scale-98 transition-transform"
                      onClick={() => {
                        toast.dismiss(tId);
                        store.setActiveConversation(message.conversationId);
                        router.push("/app/messages");
                      }}
                    >
                      <img 
                        src={avatar} 
                        className="w-10 h-10 rounded-full object-cover shrink-0 border border-blue-100 shadow-sm" 
                        alt={conv.otherParticipantName} 
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-blue-600 uppercase tracking-wider mb-0.5">
                          Tin nhắn mới
                        </div>
                        <div className="font-semibold text-[13px] text-gray-950 truncate">
                          {conv.otherParticipantName}
                        </div>
                        <div className="text-xs text-gray-500 truncate mt-0.5 max-w-[200px]">
                          {message.content}
                        </div>
                      </div>
                    </div>,
                    { duration: 6000 }
                  );
                } else {
                  // Tải lại danh sách cuộc trò chuyện nếu phòng chat này chưa hiển thị ở sidebar
                  chatApi.getConversations()
                    .then((data) => {
                      store.setConversations(data);
                      const newConv = data.find((c) => c.id === message.conversationId);
                      const name = newConv ? newConv.otherParticipantName : "Người dùng RentSpace";
                      const avatar = newConv?.otherParticipantAvatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}`;
                      
                      let tId: string | number;
                      tId = toast(
                        <div 
                          className="flex items-center gap-3 cursor-pointer py-1.5 w-full active:scale-98 transition-transform"
                          onClick={() => {
                            toast.dismiss(tId);
                            store.setActiveConversation(message.conversationId);
                            router.push("/app/messages");
                          }}
                        >
                          <img 
                            src={avatar} 
                            className="w-10 h-10 rounded-full object-cover shrink-0 border border-blue-100 shadow-sm" 
                            alt={name} 
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-xs text-blue-600 uppercase tracking-wider mb-0.5">
                              Tin nhắn mới
                            </div>
                            <div className="font-semibold text-[13px] text-gray-950 truncate">
                              {name}
                            </div>
                            <div className="text-xs text-gray-500 truncate mt-0.5 max-w-[200px]">
                              {message.content}
                            </div>
                          </div>
                        </div>,
                        { duration: 6000 }
                      );
                    })
                    .catch((err) => console.error("[useChat] Lỗi khi đồng bộ danh sách cuộc trò chuyện:", err));
                }
              }
            } catch (err) {
              console.error("[useChat] Error parsing message body:", err);
            }
          });

          // 2. Subscribe to personal push notifications
          sharedStompClient?.subscribe("/user/queue/notifications", (frame) => {
            try {
              const notification = JSON.parse(frame.body);
              toast(notification.title, {
                description: notification.content,
                duration: 5000,
              });
            } catch (err) {
              console.error("[useChat] Error parsing notification body:", err);
            }
          });

          // 3. Subscribe to real-time message read receipts (Seen)
          sharedStompClient?.subscribe("/user/queue/messages.read", (frame) => {
            try {
              const payload = JSON.parse(frame.body);
              const conversationId = Number(payload.conversationId);
              const readerId = Number(payload.readerId);
              useChatStore.getState().markAllMessagesAsReadForParticipant(conversationId, readerId);
            } catch (err) {
              console.error("[useChat] Error parsing messages.read body:", err);
            }
          });

          // 4. Subscribe to real-time typing status (đang nhập tin nhắn)
          sharedStompClient?.subscribe("/user/queue/messages.typing", (frame) => {
            try {
              const payload = JSON.parse(frame.body);
              const conversationId = Number(payload.conversationId);
              const isTyping = Boolean(payload.isTyping);
              useChatStore.getState().setTyping(conversationId, isTyping);
            } catch (err) {
              console.error("[useChat] Error parsing messages.typing body:", err);
            }
          });
        },
        onDisconnect: () => {
          setConnected(false);
        },
        onStompError: (frame) => {
          // Xử lý lỗi STOMP (ví dụ: token hết hạn sau 15 phút)
          // Deactivate client cũ để force reconnect với token mới khi session refresh
          console.error("[useChat] STOMP error, will reconnect on next token refresh:", frame.headers?.message);
          setConnected(false);
          if (sharedStompClient) {
            sharedStompClient.deactivate();
            sharedStompClient = null;
          }
        },
        reconnectDelay: 5000,
      });

      sharedStompClient.activate();
    }

    return () => {
      activeHookCount--;
      if (activeHookCount <= 0 && sharedStompClient) {
        sharedStompClient.deactivate();
        sharedStompClient = null;
      }
    };
  }, [token, setConnected, addMessage, router]);


  const sendMessage = useCallback(
    (receiverId: number, content: string, messageType = "TEXT", fileUrl?: string) => {
      if (!sharedStompClient?.connected) {
        console.error("[useChat] Cannot send message: STOMP client is disconnected.");
        toast.error("Không thể gửi tin nhắn. Mất kết nối máy chủ.");
        return;
      }
      sharedStompClient.publish({
        destination: "/app/chat.send",
        body: JSON.stringify({ receiverId, content, messageType, fileUrl }),
      });
    },
    []
  );

  const sendReadReceipt = useCallback(
    (conversationId: number) => {
      if (!sharedStompClient?.connected) return;
      sharedStompClient.publish({
        destination: "/app/chat.read",
        body: JSON.stringify({ conversationId }),
      });
    },
    []
  );

  const sendTypingStatus = useCallback(
    (conversationId: number, isTyping: boolean) => {
      if (!sharedStompClient?.connected) return;
      sharedStompClient.publish({
        destination: "/app/chat.typing",
        body: JSON.stringify({ conversationId, isTyping }),
      });
    },
    []
  );

  return { sendMessage, sendReadReceipt, sendTypingStatus };
}
