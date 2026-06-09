"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useChatStore } from "@/store/chatStore";
import { chatApi } from "@/lib/api/chat";
import { ConversationList, ChatWindow } from "@/components/chat";

export default function MessagesPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const sessionUserId = Number(session?.user?.id || 0);

  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    setConversations,
  } = useChatStore();

  // 1. Tải danh sách hội thoại của người dùng khi component được mount
  useEffect(() => {
    if (token) {
      chatApi
        .getConversations()
        .then((data) => {
          setConversations(data);
        })
        .catch((err) => {
          console.error("Lỗi khi lấy danh sách cuộc trò chuyện:", err);
        });
    }
  }, [token, setConversations]);

  return (
    <div className="h-[calc(100vh-4rem)] bg-gray-50 overflow-hidden">
      <div className="h-full max-w-7xl mx-auto flex">
        {/* Conversations List (Sidebar) */}
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          setActiveConversation={setActiveConversation}
        />

        {/* Messages Area (Chat Window) */}
        {activeConversationId && sessionUserId > 0 ? (
          <ChatWindow
            activeConversationId={activeConversationId}
            sessionUserId={sessionUserId}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50/50">
            <div className="text-center text-gray-400">
              <p className="text-sm">Chọn một cuộc trò chuyện từ thanh bên để bắt đầu</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
