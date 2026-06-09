import { create } from "zustand";
import { notificationApi, NotificationResponse } from "@/lib/api/notification";

interface NotificationState {
  notifications: NotificationResponse[];
  unreadCount: number;
  isLoading: boolean;

  fetchNotifications: () => Promise<void>;
  addNotification: (notification: NotificationResponse) => void;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const data = await notificationApi.getNotifications();
      const unreadCount = data.filter((n) => !n.isRead).length;
      set({ notifications: data, unreadCount, isLoading: false });
    } catch (err) {
      console.error("Lỗi khi tải danh sách thông báo:", err);
      set({ isLoading: false });
    }
  },

  addNotification: (notification) => {
    set((state) => {
      // Tránh trùng lặp
      if (state.notifications.some((n) => n.id === notification.id)) {
        return state;
      }
      const updated = [notification, ...state.notifications];
      const unreadCount = updated.filter((n) => !n.isRead).length;
      return { notifications: updated, unreadCount };
    });
  },

  markAsRead: async (id) => {
    try {
      await notificationApi.markAsRead(id);
      set((state) => {
        const updated = state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        );
        const unreadCount = updated.filter((n) => !n.isRead).length;
        return { notifications: updated, unreadCount };
      });
    } catch (err) {
      console.error(`Lỗi khi đánh dấu đã đọc thông báo ${id}:`, err);
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationApi.markAllAsRead();
      set((state) => {
        const updated = state.notifications.map((n) => ({ ...n, isRead: true }));
        return { notifications: updated, unreadCount: 0 };
      });
    } catch (err) {
      console.error("Lỗi khi đánh dấu đã đọc tất cả thông báo:", err);
    }
  },
}));
