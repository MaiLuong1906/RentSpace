"use client";

import { useState, useRef, useEffect } from "react";
import { Send, ImagePlus, Film, Paperclip, X, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";

interface ChatInputProps {
  onSend: (content: string, type: "IMAGE" | "VIDEO" | "FILE" | null, file: File | null) => Promise<void>;
  isUploading: boolean;
  activeConversationId: number | null;
  sendTypingStatus: (conversationId: number, isTyping: boolean) => void;
}

export function ChatInput({ onSend, isUploading, activeConversationId, sendTypingStatus }: ChatInputProps) {
  const [messageInput, setMessageInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"IMAGE" | "VIDEO" | "FILE" | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef<boolean>(false);

  // Clear typing status on unmount or active conversation change
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

    // Reset input value to allow selecting same file again
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversationId) return;
    if (!messageInput.trim() && !selectedFile) return;

    try {
      await onSend(messageInput.trim(), fileType, selectedFile);
      
      // Cleanup preview & input states
      if (filePreview) URL.revokeObjectURL(filePreview);
      setSelectedFile(null);
      setFileType(null);
      setFilePreview(null);
      setMessageInput("");
    } catch (err) {
      console.error("[ChatInput] Error sending message:", err);
    }

    // Reset typing status
    if (isTypingRef.current) {
      isTypingRef.current = false;
      sendTypingStatus(activeConversationId, false);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 space-y-2 bg-white">
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
              {((selectedFile?.size || 0) / (1024 * 1024)).toFixed(2)} MB
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
          disabled={isUploading}
        >
          <ImagePlus className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => videoInputRef.current?.click()}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
          title="Gửi video"
          disabled={isUploading}
        >
          <Film className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
          title="Đính kèm tài liệu"
          disabled={isUploading}
        >
          <Paperclip className="h-5 w-5" />
        </button>

        <input
          type="text"
          value={messageInput}
          onChange={handleInputChange}
          placeholder={selectedFile ? "Thêm chú thích (tuỳ chọn)..." : "Nhập tin nhắn..."}
          className="flex-1 ml-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-800"
          disabled={isUploading}
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
  );
}
