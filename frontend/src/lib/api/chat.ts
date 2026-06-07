import apiClient from "./axios";

export interface ConversationResponse {
  id: number;
  otherParticipantId: number;
  otherParticipantName: string;
  otherParticipantAvatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

export interface MessageResponse {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  isOwn: boolean;
  isRead: boolean;
  messageType: "TEXT" | "IMAGE" | "VIDEO" | "FILE";
  fileUrl?: string;
  createdAt: string;
}

export interface CreateConversationRequest {
  landlordId: number;
}

export const chatApi = {
  getConversations: async () => {
    const response = await apiClient.get<{ success: boolean; data: ConversationResponse[] }>("/conversations");
    return response.data.data;
  },

  getMessages: async (conversationId: number, page = 0, size = 20) => {
    const response = await apiClient.get<{
      success: boolean;
      data: {
        content: MessageResponse[];
        totalPages: number;
        totalElements: number;
      };
    }>(`/conversations/${conversationId}/messages`, {
      params: { page, size },
    });
    return response.data.data;
  },

  createConversation: async (landlordId: number) => {
    const response = await apiClient.post<{ success: boolean; data: ConversationResponse }>("/conversations", {
      landlordId,
    });
    return response.data.data;
  },

  uploadChatImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post<{ success: boolean; data: { fileUrl: string } }>(
      "/chat/upload-image",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data.data.fileUrl;
  },

  uploadChatVideo: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post<{ success: boolean; data: { fileUrl: string } }>(
      "/chat/upload-video",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data.data.fileUrl;
  },

  uploadChatFile: async (file: File): Promise<{ fileUrl: string; fileName: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post<{
      success: boolean;
      data: { fileUrl: string; fileName: string; messageType: string };
    }>(
      "/chat/upload-file",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return {
      fileUrl: response.data.data.fileUrl,
      fileName: response.data.data.fileName ?? file.name,
    };
  },
};
