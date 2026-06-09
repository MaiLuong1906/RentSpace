"use client";

import { ChatMessage } from "@/store/chatStore";
import { FileText } from "lucide-react";

interface MessageBubbleProps {
  message: ChatMessage;
  isMe: boolean;
  showStatus: boolean;
}

export function MessageBubble({ message, isMe, showStatus }: MessageBubbleProps) {
  const isImage = message.messageType === "IMAGE";
  const isVideo = message.messageType === "VIDEO";
  const isFile = message.messageType === "FILE";

  const timeString = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col">
      <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-sm overflow-hidden ${
            isMe
              ? isImage
                ? "rounded-2xl shadow-md"
                : "bg-blue-600 text-white rounded-t-2xl rounded-l-2xl px-4 py-2.5"
              : isImage
              ? "rounded-2xl shadow-md"
              : "bg-white text-gray-900 border border-gray-200 rounded-t-2xl rounded-r-2xl px-4 py-2.5"
          } shadow-sm text-sm`}
        >
          {isImage && message.fileUrl ? (
            <div className="relative group">
              <a href={message.fileUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={message.fileUrl}
                  alt="Ảnh đính kèm"
                  className="max-w-xs max-h-64 rounded-2xl object-cover cursor-pointer hover:opacity-95 transition-opacity"
                />
              </a>
              {message.content && message.content !== "📷 Ảnh" && (
                <p className={`text-xs mt-1.5 px-1 ${isMe ? "text-white" : "text-gray-700"}`}>
                  {message.content}
                </p>
              )}
              <p className="text-[9px] mt-1 text-right px-1 text-gray-400">{timeString}</p>
            </div>
          ) : isVideo && message.fileUrl ? (
            <div className="relative group max-w-xs p-1">
              <video
                src={message.fileUrl}
                controls
                playsInline
                className="max-w-xs max-h-64 rounded-2xl object-cover border border-gray-200"
              />
              {message.content && message.content !== "🎥 Video" && (
                <p className={`text-xs mt-1.5 px-1 ${isMe ? "text-white" : "text-gray-700"}`}>
                  {message.content}
                </p>
              )}
              <p className="text-[9px] mt-1 text-right px-1 text-gray-400">{timeString}</p>
            </div>
          ) : isFile && message.fileUrl ? (
            <div className="flex flex-col p-1.5">
              <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl shadow-sm max-w-xs">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate">
                    {message.content.startsWith("📁 Tài liệu:")
                      ? message.content.replace("📁 Tài liệu: ", "")
                      : message.content}
                  </p>
                  <a
                    href={message.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-blue-600 hover:underline mt-0.5 inline-block"
                  >
                    Tải xuống tài liệu
                  </a>
                </div>
              </div>
              <p className="text-[9px] mt-1.5 text-right text-gray-400">{timeString}</p>
            </div>
          ) : (
            <>
              <p className="break-words leading-relaxed">{message.content}</p>
              <p className={`text-[9px] mt-1 text-right ${isMe ? "text-blue-100" : "text-gray-400"}`}>
                {timeString}
              </p>
            </>
          )}
        </div>
      </div>
      
      {/* Chỉ báo trạng thái Đã gửi / Đã xem cho tin nhắn cuối cùng do chính mình gửi */}
      {showStatus && isMe && (
        <div className="flex justify-end text-[10px] text-gray-400 mt-1 mr-1 font-medium">
          {message.isRead ? "Đã xem" : "Đã gửi"}
        </div>
      )}
    </div>
  );
}
