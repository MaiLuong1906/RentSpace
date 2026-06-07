import apiClient from "./axios";

export interface NotificationResponse {
  id: number;
  userId: number;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationApi = {
  getNotifications: async () => {
    const response = await apiClient.get<{ success: boolean; data: NotificationResponse[] }>("/notifications");
    return response.data.data;
  },

  markAsRead: async (id: number) => {
    const response = await apiClient.put<{ success: boolean; data: null }>(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await apiClient.put<{ success: boolean; data: null }>("/notifications/read-all");
    return response.data;
  },
};
