import { create } from "zustand";

export interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  receiverId?: number;
  content: string;
  isRead: boolean;
  messageType?: "TEXT" | "IMAGE" | "VIDEO" | "FILE";
  fileUrl?: string;
  fileName?: string;
  createdAt: string;
}

export interface ChatConversation {
  id: number;
  otherParticipantId: number;
  otherParticipantName: string;
  otherParticipantAvatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

interface ChatState {
  conversations: ChatConversation[];
  activeConversationId: number | null;
  messages: Record<number, ChatMessage[]>; // conversationId -> messages
  isConnected: boolean;
  totalUnread: number;
  typingStatus: Record<number, boolean>; // conversationId -> isTyping

  // Actions
  setConnected: (connected: boolean) => void;
  setActiveConversation: (conversationId: number | null) => void;
  addMessage: (conversationId: number, message: ChatMessage) => void;
  setConversations: (conversations: ChatConversation[]) => void;
  setMessages: (conversationId: number, messages: ChatMessage[]) => void;
  markAsRead: (conversationId: number) => void;
  markAllMessagesAsReadForParticipant: (conversationId: number, readerId: number) => void;
  setTyping: (conversationId: number, isTyping: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  isConnected: false,
  totalUnread: 0,
  typingStatus: {},

  setConnected: (isConnected) => set({ isConnected }),

  setActiveConversation: (activeConversationId) =>
    set({ activeConversationId }),

  addMessage: (conversationId, message) =>
    set((state) => {
      const conversationMessages = state.messages[conversationId] || [];

      // Dedup: bỏ qua nếu message.id đã tồn tại trong store (tránh hiện 2 lần khi WebSocket echo + REST load)
      const isDuplicate = message.id != null && conversationMessages.some((m) => m.id === message.id);
      if (isDuplicate) return state;

      const messageWithReadStatus = {
        ...message,
        isRead: message.isRead !== undefined ? message.isRead : false,
      };
      const updatedMessages = {
        ...state.messages,
        [conversationId]: [...conversationMessages, messageWithReadStatus],
      };

      // Cập nhật tin nhắn cuối cùng (lastMessage) trong danh sách conversations
      const updatedConversations = state.conversations.map((c) => {
        if (c.id === conversationId) {
          return {
            ...c,
            lastMessage: message.content,
            lastMessageTime: message.createdAt,
            unreadCount: state.activeConversationId === conversationId ? 0 : c.unreadCount + 1,
          };
        }
        return c;
      });

      // Sắp xếp lại cuộc trò chuyện có tin nhắn mới lên đầu
      updatedConversations.sort(
        (a, b) =>
          new Date(b.lastMessageTime || 0).getTime() -
          new Date(a.lastMessageTime || 0).getTime()
      );

      const totalUnread = updatedConversations.reduce((sum, c) => sum + c.unreadCount, 0);

      return {
        messages: updatedMessages,
        conversations: updatedConversations,
        totalUnread,
      };
    }),

  setConversations: (conversations) => {
    // Sắp xếp cuộc hội thoại theo tin nhắn mới nhất
    const sorted = [...conversations].sort(
      (a, b) =>
        new Date(b.lastMessageTime || 0).getTime() -
        new Date(a.lastMessageTime || 0).getTime()
    );
    const totalUnread = sorted.reduce((sum, c) => sum + c.unreadCount, 0);
    set({ conversations: sorted, totalUnread });
  },

  setMessages: (conversationId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: messages,
      },
    })),

  markAsRead: (conversationId) =>
    set((state) => {
      const updatedConversations = state.conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      );
      const totalUnread = updatedConversations.reduce((sum, c) => sum + c.unreadCount, 0);

      const conversationMessages = state.messages[conversationId] || [];
      const updatedMessagesList = conversationMessages.map((m) => ({
        ...m,
        isRead: true,
      }));

      return {
        conversations: updatedConversations,
        totalUnread,
        messages: {
          ...state.messages,
          [conversationId]: updatedMessagesList,
        },
      };
    }),

  // Cập nhật trạng thái isRead=true cho các tin nhắn được gửi BỞI readerId
  // (đối phương đã đọc những tin nhắn mà mình gửi)
  markAllMessagesAsReadForParticipant: (conversationId, readerId) =>
    set((state) => {
      const conversationMessages = state.messages[conversationId] || [];
      const updatedMessagesList = conversationMessages.map((m) => ({
        ...m,
        // Chỉ mark là đã đọc nếu tin nhắn được gửi BỞI currentUser (senderId != readerId)
        // tức là readerId đã đọc những tin nhắn của người đối diện
        isRead: m.senderId !== readerId ? true : m.isRead,
      }));

      return {
        messages: {
          ...state.messages,
          [conversationId]: updatedMessagesList,
        },
      };
    }),

  setTyping: (conversationId, isTyping) =>
    set((state) => ({
      typingStatus: {
        ...state.typingStatus,
        [conversationId]: isTyping,
      },
    })),
}));
