"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Search, Send, MoreVertical, ImagePlus, X, Loader2, Film, Paperclip, FileText } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useChat } from "@/hooks/useChat";
import { useChatStore } from "@/store/chatStore";
import { chatApi } from "@/lib/api/chat";

export default function MessagesPage() {
  const { data: session } = useSession();
  const { sendMessage, sendReadReceipt, sendTypingStatus } = useChat();
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"IMAGE" | "VIDEO" | "FILE" | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef<boolean>(false);

  const {
    conversations,
    activeConversationId,
    messages,
    typingStatus,
    setActiveConversation,
    setConversations,
    setMessages,
    markAsRead,
  } = useChatStore();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);

    if (!activeConversationId) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendTypingStatus(activeConversationId, true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      sendTypingStatus(activeConversationId, false);
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (activeConversationId && isTypingRef.current) {
        sendTypingStatus(activeConversationId, false);
        isTypingRef.current = false;
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [activeConversationId, sendTypingStatus]);

  const token = session?.accessToken;

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

  // 2. Tải lịch sử tin nhắn khi chọn một cuộc hội thoại cụ thể
  useEffect(() => {
    if (activeConversationId) {
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
    }
  }, [activeConversationId, setMessages, markAsRead, sendReadReceipt]);

  const selectedConv = conversations.find((c) => c.id === activeConversationId);
  const activeMessages = useMemo(() => {
    return activeConversationId ? messages[activeConversationId] || [] : [];
  }, [messages, activeConversationId]);

  // 2.5. Khi có tin nhắn mới trong cuộc hội thoại đang mở, tự động gửi tín hiệu đã đọc
  useEffect(() => {
    if (activeConversationId && activeMessages.length > 0) {
      const lastMessage = activeMessages[activeMessages.length - 1];
      if (Number(lastMessage.senderId) !== Number(session?.user?.id) && !lastMessage.isRead) {
        sendReadReceipt(activeConversationId);
        markAsRead(activeConversationId);
      }
    }
  }, [activeMessages, activeConversationId, sendReadReceipt, markAsRead, session?.user?.id]);

  // 3. Tự động cuộn xuống cuối khung chat khi có tin nhắn mới hoặc đổi phòng chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages, activeConversationId]);

  // Lọc cuộc hội thoại theo thanh tìm kiếm
  const filteredConversations = conversations.filter((c) =>
    c.otherParticipantName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "IMAGE" | "VIDEO" | "FILE") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "IMAGE") {
      if (!file.type.startsWith("image/")) {
        toast.error("Chỉ hỗ trợ file ảnh (JPEG, PNG, GIF, WEBP)");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ảnh không được vượt quá 5MB");
        return;
      }
    } else if (type === "VIDEO") {
      if (!file.type.startsWith("video/")) {
        toast.error("Chỉ hỗ trợ file video (MP4, MOV, AVI, WebM, MKV)");
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        toast.error("Video không được vượt quá 100MB");
        return;
      }
    } else if (type === "FILE") {
      if (file.size > 20 * 1024 * 1024) {
        toast.error("Tài liệu không được vượt quá 20MB");
        return;
      }
    }

    setSelectedFile(file);
    setFileType(type);
    setFilePreview(URL.createObjectURL(file));
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCancelFile = () => {
    setSelectedFile(null);
    setFileType(null);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversationId || !selectedConv) return;
    if (!messageInput.trim() && !selectedFile) return;

    if (selectedFile && fileType) {
      setIsUploading(true);
      try {
        let fileUrl = "";
        let content = messageInput.trim();

        if (fileType === "IMAGE") {
          fileUrl = await chatApi.uploadChatImage(selectedFile);
          if (!content) content = "📷 Ảnh";
        } else if (fileType === "VIDEO") {
          fileUrl = await chatApi.uploadChatVideo(selectedFile);
          if (!content) content = "🎥 Video";
        } else if (fileType === "FILE") {
          const res = await chatApi.uploadChatFile(selectedFile);
          fileUrl = res.fileUrl;
          if (!content) content = `📁 Tài liệu: ${res.fileName}`;
        }

        sendMessage(selectedConv.otherParticipantId, content, fileType, fileUrl);
        // Revoke object URL để giải phóng memory trước khi reset state
        if (filePreview) URL.revokeObjectURL(filePreview);
        setSelectedFile(null);
        setFileType(null);
        setFilePreview(null);
        setMessageInput("");
      } catch (err) {
        console.error("Lỗi gửi file:", err);
        toast.error("Lỗi upload tệp tin. Vui lòng thử lại.");
      } finally {
        setIsUploading(false);
      }
    } else {
      sendMessage(selectedConv.otherParticipantId, messageInput.trim());
      setMessageInput("");
    }

    if (isTypingRef.current) {
      isTypingRef.current = false;
      sendTypingStatus(activeConversationId, false);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] bg-gray-50">
      <div className="h-full max-w-7xl mx-auto flex">
        {/* Conversations List (Sidebar) */}
        <div className="w-full md:w-96 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold mb-4">Tin nhắn</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm cuộc trò chuyện..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-800"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => {
                const isSelected = activeConversationId === conv.id;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConversation(conv.id)}
                    className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                      isSelected ? "bg-blue-50/70" : ""
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={
                          conv.otherParticipantAvatar ||
                          `https://api.dicebear.com/7.x/adventurer/svg?seed=${conv.otherParticipantName}`
                        }
                        alt={conv.otherParticipantName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <span
                        className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 border-white shadow-sm ${
                          conv.isOnline ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                    </div>

                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-950 truncate text-sm">
                          {conv.otherParticipantName}
                        </span>
                        {conv.lastMessageTime && (
                          <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">
                            {new Date(conv.lastMessageTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 truncate mr-2">
                          {conv.lastMessage || "Chưa có tin nhắn nào"}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="flex-shrink-0 px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-sm text-gray-500">
                Không tìm thấy hội thoại nào
              </div>
            )}
          </div>
        </div>

        {/* Messages Area (Chat Window) */}
        {selectedConv ? (
          <div className="flex-1 flex flex-col bg-white">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
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
                activeMessages.map((message, index) => (
                  <div key={message.id || `msg-${message.createdAt}-${index}`} className="flex flex-col">
                    <div
                      className={`flex ${Number(message.senderId) === Number(session?.user?.id) ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-sm overflow-hidden ${
                          Number(message.senderId) === Number(session?.user?.id)
                            ? message.messageType === "IMAGE" ? "rounded-2xl shadow-md" : "bg-blue-600 text-white rounded-t-2xl rounded-l-2xl px-4 py-2.5"
                            : message.messageType === "IMAGE" ? "rounded-2xl shadow-md" : "bg-white text-gray-900 border border-gray-200 rounded-t-2xl rounded-r-2xl px-4 py-2.5"
                        } shadow-sm text-sm`}
                      >
                        {message.messageType === "IMAGE" && message.fileUrl ? (
                          <div className="relative group">
                            <a href={message.fileUrl} target="_blank" rel="noopener noreferrer">
                              <img
                                src={message.fileUrl}
                                alt="Ảnh đính kèm"
                                className="max-w-xs max-h-64 rounded-2xl object-cover cursor-pointer hover:opacity-95 transition-opacity"
                              />
                            </a>
                            {message.content && message.content !== "📷 Ảnh" && (
                              <p className={`text-xs mt-1.5 px-1 ${
                                Number(message.senderId) === Number(session?.user?.id) ? "text-white" : "text-gray-700"
                              }`}>{message.content}</p>
                            )}
                            <p className="text-[9px] mt-1 text-right px-1 text-gray-400">
                              {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        ) : message.messageType === "VIDEO" && message.fileUrl ? (
                          <div className="relative group max-w-xs p-1">
                            <video
                              src={message.fileUrl}
                              controls
                              playsInline
                              className="max-w-xs max-h-64 rounded-2xl object-cover border border-gray-200"
                            />
                            {message.content && message.content !== "🎥 Video" && (
                              <p className={`text-xs mt-1.5 px-1 ${
                                Number(message.senderId) === Number(session?.user?.id) ? "text-white" : "text-gray-700"
                              }`}>{message.content}</p>
                            )}
                            <p className="text-[9px] mt-1 text-right px-1 text-gray-400">
                              {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        ) : message.messageType === "FILE" && message.fileUrl ? (
                          <div className="flex flex-col p-1.5">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl shadow-sm max-w-xs">
                              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                <FileText className="h-6 w-6" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-900 truncate">
                                  {message.content.startsWith("📁 Tài liệu:") ? message.content.replace("📁 Tài liệu: ", "") : message.content}
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
                            <p className="text-[9px] mt-1.5 text-right text-gray-400">
                              {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        ) : (
                          <>
                            <p className="break-words leading-relaxed">{message.content}</p>
                            <p
                              className={`text-[9px] mt-1 text-right ${
                                Number(message.senderId) === Number(session?.user?.id) ? "text-blue-100" : "text-gray-400"
                              }`}
                            >
                              {new Date(message.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    {/* Chỉ báo trạng thái Đã gửi / Đã xem cho tin nhắn cuối cùng do chính mình gửi */}
                    {index === activeMessages.length - 1 && Number(message.senderId) === Number(session?.user?.id) && (
                      <div className="flex justify-end text-[10px] text-gray-400 mt-1 mr-1 font-medium">
                        {message.isRead ? "Đã xem" : "Đã gửi"}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">
                  Chưa có tin nhắn nào. Gửi tin nhắn để bắt đầu cuộc trò chuyện.
                </div>
              )}

              {/* Chỉ báo đối phương đang nhập tin nhắn */}
              {activeConversationId && typingStatus[activeConversationId] && (
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
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 space-y-2">
              {/* Attachment Preview */}
              {filePreview && (
                <div className="relative inline-flex items-center gap-3 p-2 bg-gray-50 border border-gray-200 rounded-xl shadow-sm max-w-max">
                  {fileType === "IMAGE" && (
                    <img src={filePreview} alt="Preview" className="h-16 w-16 rounded-lg object-cover border border-gray-200 shadow-sm" />
                  )}
                  {fileType === "VIDEO" && (
                    <div className="relative h-16 w-16 bg-black rounded-lg flex items-center justify-center border border-gray-200">
                      <Film className="h-7 w-7 text-white animate-pulse" />
                    </div>
                  )}
                  {fileType === "FILE" && (
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                      <FileText className="h-7 w-7" />
                    </div>
                  )}
                  <div className="flex flex-col pr-6">
                    <span className="text-xs font-semibold text-gray-900 truncate max-w-[150px]">
                      {selectedFile?.name}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {(selectedFile!.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelFile}
                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 flex items-center justify-center shadow transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-1">
                {/* Hidden file inputs */}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, "IMAGE")}
                />
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm,video/mpeg"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, "VIDEO")}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z,.txt"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, "FILE")}
                />

                {/* Upload Buttons */}
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
                  title="Gửi ảnh"
                >
                  <ImagePlus className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
                  title="Gửi video"
                >
                  <Film className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
                  title="Đính kèm tài liệu"
                >
                  <Paperclip className="h-5 w-5" />
                </button>

                <input
                  type="text"
                  value={messageInput}
                  onChange={handleInputChange}
                  placeholder={selectedFile ? "Thêm chú thích (tuỳ chọn)..." : "Nhập tin nhắn..."}
                  className="flex-1 ml-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-800"
                />
                <button
                  type="submit"
                  disabled={(!messageInput.trim() && !selectedFile) || isUploading}
                  className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </form>
          </div>
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
