"use client";

import { useState } from "react";
import { Search, Send, MoreVertical } from "lucide-react";

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  time: string;
  isOwn: boolean;
}

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>("1");
  const [messageInput, setMessageInput] = useState("");

  const conversations: Conversation[] = [
    {
      id: "1",
      name: "Chị Mai Hương",
      avatar: "https://i.pravatar.cc/150?img=1",
      lastMessage: "Phòng vẫn còn trống bạn nhé",
      time: "10 phút trước",
      unread: 2,
      online: true,
    },
    {
      id: "2",
      name: "Anh Tuấn Anh",
      avatar: "https://i.pravatar.cc/150?img=12",
      lastMessage: "Bạn có thể đến xem phòng chiều nay không?",
      time: "1 giờ trước",
      unread: 0,
      online: false,
    },
    {
      id: "3",
      name: "Cô Phương",
      avatar: "https://i.pravatar.cc/150?img=5",
      lastMessage: "Cảm ơn bạn đã quan tâm",
      time: "2 giờ trước",
      unread: 0,
      online: true,
    },
  ];

  const messages: Message[] = [
    {
      id: "1",
      senderId: "1",
      content: "Xin chào, tôi quan tâm đến phòng trọ của bạn",
      time: "14:30",
      isOwn: true,
    },
    {
      id: "2",
      senderId: "2",
      content: "Chào bạn! Phòng vẫn còn trống nhé",
      time: "14:32",
      isOwn: false,
    },
    {
      id: "3",
      senderId: "1",
      content: "Tôi có thể đến xem phòng được không ạ?",
      time: "14:33",
      isOwn: true,
    },
    {
      id: "4",
      senderId: "2",
      content: "Được chứ, bạn có thể đến chiều nay hoặc mai đều được",
      time: "14:35",
      isOwn: false,
    },
  ];

  const selectedConv = conversations.find((c) => c.id === selectedConversation);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    // TODO: Send message via WebSocket
    console.log("Send message:", messageInput);
    setMessageInput("");
  };

  return (
    <div className="h-[calc(100vh-4rem)] bg-gray-50">
      <div className="h-full max-w-7xl mx-auto flex">
        {/* Conversations List */}
        <div className="w-full md:w-96 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold mb-4">Tin nhắn</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm cuộc trò chuyện..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv.id)}
                className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                  selectedConversation === conv.id ? "bg-blue-50" : ""
                }`}
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={conv.avatar}
                    alt={conv.name}
                    className="w-12 h-12 rounded-full"
                  />
                  {conv.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>

                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900 truncate">
                      {conv.name}
                    </span>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {conv.time}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 truncate">
                      {conv.lastMessage}
                    </p>
                    {conv.unread > 0 && (
                      <span className="flex-shrink-0 ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Messages Area */}
        {selectedConv ? (
          <div className="flex-1 flex flex-col bg-white hidden md:flex">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={selectedConv.avatar}
                    alt={selectedConv.name}
                    className="w-10 h-10 rounded-full"
                  />
                  {selectedConv.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {selectedConv.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedConv.online ? "Đang hoạt động" : "Không hoạt động"}
                  </p>
                </div>
              </div>

              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <MoreVertical className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-md ${
                      message.isOwn
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    } rounded-2xl px-4 py-2`}
                  >
                    <p>{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.isOwn ? "text-blue-100" : "text-gray-500"
                      }`}
                    >
                      {message.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex-1 hidden md:flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <p>Chọn một cuộc trò chuyện để bắt đầu</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
