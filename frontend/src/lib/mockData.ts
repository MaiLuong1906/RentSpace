// Utility helpers dùng chung trong toàn bộ ứng dụng
// Mock data đã được thay thế bằng API thực tế từ backend

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: "tenant" | "landlord" | "admin";
  verified: boolean;
  kycStatus: "pending" | "approved" | "rejected" | "not_submitted";
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage: Message;
  unreadCount: number;
}

// --- Utility functions vẫn được các trang khác sử dụng ---

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

export const getRoomTypeLabel = (roomType: string): string => {
  const labels: Record<string, string> = {
    single: "Phòng đơn",
    shared: "Phòng ở ghép",
    apartment: "Căn hộ",
    studio: "Studio",
  };
  return labels[roomType] || roomType;
};
