"use client";

import { useEffect, useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useChatStore } from "@/store/chatStore";
import { chatApi } from "@/lib/api/chat";
import { ConversationList, ChatWindow } from "../../../components/chat";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

function MessagesContent() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const sessionUserId = Number(session?.user?.id || 0);
  const searchParams = useSearchParams();
  const router = useRouter();
  const targetUserIdStr = searchParams.get("userId");

  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    setConversations,
  } = useChatStore();

  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Tải danh sách hội thoại của người dùng khi component được mount
  useEffect(() => {
    if (token) {
      chatApi
        .getConversations()
        .then((data) => {
          setConversations(data);
          setIsLoaded(true);
        })
        .catch((err) => {
          console.error("Lỗi khi lấy danh sách cuộc trò chuyện:", err);
          setIsLoaded(true);
        });
    }
  }, [token, setConversations]);

  // 2. Xử lý tự động mở/tạo cuộc hội thoại dựa trên query parameter `userId`
  useEffect(() => {
    if (token && targetUserIdStr && isLoaded) {
      const targetUserId = parseInt(targetUserIdStr, 10);
      if (isNaN(targetUserId)) return;

      // Tránh tự nhắn tin với chính mình
      if (targetUserId === sessionUserId) {
        router.replace("/app/messages");
        return;
      }

      // Tìm xem cuộc hội thoại với user này đã tồn tại chưa
      const existingConv = conversations.find(
        (c) => c.otherParticipantId === targetUserId
      );

      if (existingConv) {
        setActiveConversation(existingConv.id);
        router.replace("/app/messages");
      } else {
        // Nếu chưa có hội thoại, tiến hành tạo mới
        chatApi
          .createConversation(targetUserId)
          .then((newConv) => {
            setConversations([newConv, ...conversations]);
            setActiveConversation(newConv.id);
            router.replace("/app/messages");
          })
          .catch((err) => {
            console.error("Lỗi khi tạo cuộc hội thoại mới:", err);
            const errMsg = err?.response?.data?.message || "Không thể nhắn tin với người dùng này.";
            toast.error(errMsg);
            router.replace("/app/messages");
          });
      }
    }
  }, [token, targetUserIdStr, isLoaded, conversations, sessionUserId, setActiveConversation, setConversations, router]);

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

function MessagesSkeleton() {
  return (
    <div className="h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-gray-400">
        <Loader2 className="animate-spin text-indigo-600" size={24} />
        <span className="text-sm">Đang tải cuộc trò chuyện...</span>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<MessagesSkeleton />}>
      <MessagesContent />
    </Suspense>
  );
}
