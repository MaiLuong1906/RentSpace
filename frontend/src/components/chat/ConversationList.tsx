"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { ChatConversation } from "@/store/chatStore";

interface ConversationListProps {
  conversations: ChatConversation[];
  activeConversationId: number | null;
  setActiveConversation: (conversationId: number | null) => void;
}

export function ConversationList({
  conversations,
  activeConversationId,
  setActiveConversation,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations.filter((c) =>
    c.otherParticipantName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full md:w-96 bg-white border-r border-gray-200 flex flex-col h-full">
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
  );
}
