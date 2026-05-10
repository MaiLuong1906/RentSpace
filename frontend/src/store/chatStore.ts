import { create } from "zustand";

interface ChatMessage {
  id: string;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: string;
  isRead: boolean;
}

interface ChatConversation {
  userId: number;
  userName: string;
  avatarUrl?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

interface ChatState {
  conversations: ChatConversation[];
  activeConversationId: number | null;
  messages: Record<number, ChatMessage[]>; // userId -> messages
  isConnected: boolean;
  totalUnread: number;

  // Actions
  setConnected: (connected: boolean) => void;
  setActiveConversation: (userId: number | null) => void;
  addMessage: (userId: number, message: ChatMessage) => void;
  setConversations: (conversations: ChatConversation[]) => void;
  markAsRead: (userId: number) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  isConnected: false,
  totalUnread: 0,

  setConnected: (isConnected) => set({ isConnected }),

  setActiveConversation: (activeConversationId) =>
    set({ activeConversationId }),

  addMessage: (userId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [userId]: [...(state.messages[userId] || []), message],
      },
    })),

  setConversations: (conversations) => {
    const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
    set({ conversations, totalUnread });
  },

  markAsRead: (userId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.userId === userId ? { ...c, unreadCount: 0 } : c
      ),
      totalUnread: Math.max(
        0,
        state.totalUnread -
          (state.conversations.find((c) => c.userId === userId)?.unreadCount || 0)
      ),
    })),
}));
