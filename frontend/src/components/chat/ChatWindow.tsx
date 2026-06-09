"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { MoreVertical, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { useChat } from "@/hooks/useChat";
import { useChatStore } from "@/store/chatStore";
import { chatApi } from "@/lib/api/chat";

interface ChatWindowProps {
  activeConversationId: number;
  sessionUserId: number;
}

export function ChatWindow({ activeConversationId, sessionUserId }: ChatWindowProps) {
  const { sendMessage, sendReadReceipt, sendTypingStatus } = useChat();
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    conversations,
    messages,
    typingStatus,
    setMessages,
    markAsRead,
  } = useChatStore();

  const selectedConv = conversations.find((c) => c.id === activeConversationId);

  // 1. Tải lịch sử tin nhắn khi chọn một cuộc hội thoại cụ thể
  useEffect(() => {
    chatApi
      .getMessages(activeConversationId, 0, 50)
      .then((data) => {
        // Sắp xếp các tin nhắn theo thứ tự thời gian tăng dần để render từ trên xuống dưới
        const chronologicalMessages = [...data.content].reverse();
        setMessages(activeConversationId, chronologicalMessages);
        markAsRead(activeConversationId);
        sendReadReceipt(activeConversationId);
      })
      .catch((err) => {
        console.error("Lỗi khi tải lịch sử tin nhắn:", err);
      });
  }, [activeConversationId, setMessages, markAsRead, sendReadReceipt]);

  const activeMessages = useMemo(() => {
    return messages[activeConversationId] || [];
  }, [messages, activeConversationId]);

  // 2. Khi có tin nhắn mới trong cuộc hội thoại đang mở, tự động gửi tín hiệu đã đọc
  useEffect(() => {
    if (activeMessages.length > 0) {
      const lastMessage = activeMessages[activeMessages.length - 1];
      if (Number(lastMessage.senderId) !== sessionUserId && !lastMessage.isRead) {
        sendReadReceipt(activeConversationId);
        markAsRead(activeConversationId);
      }
    }
  }, [activeMessages, activeConversationId, sendReadReceipt, markAsRead, sessionUserId]);

  // 3. Tự động cuộn xuống cuối khung chat khi có tin nhắn mới hoặc đổi phòng chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages, activeConversationId]);

  // 4. Xử lý gửi tin nhắn (kèm tệp đính kèm nếu có)
  const handleSend = async (content: string, type: "IMAGE" | "VIDEO" | "FILE" | null, file: File | null) => {
    if (!selectedConv) return;

    if (file && type) {
      setIsUploading(true);
      try {
        let fileUrl = "";
        let finalContent = content;

        if (type === "IMAGE") {
          fileUrl = await chatApi.uploadChatImage(file);
          if (!finalContent) finalContent = "📷 Ảnh";
        } else if (type === "VIDEO") {
          fileUrl = await chatApi.uploadChatVideo(file);
          if (!finalContent) finalContent = "🎥 Video";
        } else if (type === "FILE") {
          const res = await chatApi.uploadChatFile(file);
          fileUrl = res.fileUrl;
          if (!finalContent) finalContent = `📁 Tài liệu: ${res.fileName}`;
        }

        sendMessage(selectedConv.otherParticipantId, finalContent, type, fileUrl);
      } catch (err) {
        console.error("Lỗi gửi file:", err);
        toast.error("Lỗi upload tệp tin. Vui lòng thử lại.");
        throw err; // throw to ChatInput to prevent clearing states
      } finally {
        setIsUploading(false);
      }
    } else {
      sendMessage(selectedConv.otherParticipantId, content);
    }
  };

  if (!selectedConv) return null;

  return (
    <div className="flex-1 flex flex-col bg-white h-full overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={
                selectedConv.otherParticipantAvatar ||
                `https://api.dicebear.com/7.x/adventurer/svg?seed=${selectedConv.otherParticipantName}`
              }
              alt={selectedConv.otherParticipantName}
              className="w-10 h-10 rounded-full object-cover"
            />
            <span
              className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full border-2 border-white shadow-sm ${
                selectedConv.isOnline ? "bg-green-500" : "bg-gray-300"
              }`}
            />
          </div>
          <div>
            <h2 className="font-semibold text-gray-950 text-sm">
              {selectedConv.otherParticipantName}
            </h2>
            <p className="text-[11px] flex items-center gap-1.5 mt-0.5">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                selectedConv.isOnline ? "bg-green-500 animate-pulse" : "bg-gray-400"
              }`} />
              <span className={selectedConv.isOnline ? "text-green-600 font-semibold" : "text-gray-400"}>
                {selectedConv.isOnline ? "Đang hoạt động" : "Ngoại tuyến"}
              </span>
            </p>
          </div>
        </div>

        <button className="p-2 hover:bg-gray-100 rounded-lg">
          <MoreVertical className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {activeMessages.length > 0 ? (
          activeMessages.map((message, index) => {
            const isMe = Number(message.senderId) === sessionUserId;
            const isLastMessage = index === activeMessages.length - 1;
            return (
              <MessageBubble
                key={message.id || `msg-${message.createdAt}-${index}`}
                message={message}
                isMe={isMe}
                showStatus={isLastMessage}
              />
            );
          })
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-gray-400">
            Chưa có tin nhắn nào. Gửi tin nhắn để bắt đầu cuộc trò chuyện.
          </div>
        )}

        {/* Chỉ báo đối phương đang nhập tin nhắn */}
        {typingStatus[activeConversationId] && (
          <div className="flex items-center gap-2 p-3 bg-white border border-gray-100 rounded-2xl max-w-max shadow-sm animate-pulse ml-2 mt-2">
            <div className="flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
            </div>
            <span className="text-xs font-semibold text-gray-500">
              {selectedConv.otherParticipantName} đang nhập...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form */}
      <ChatInput
        onSend={handleSend}
        isUploading={isUploading}
        activeConversationId={activeConversationId}
        sendTypingStatus={sendTypingStatus}
      />
    </div>
  );
}
