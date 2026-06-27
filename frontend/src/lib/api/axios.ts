import axios from "axios";
import { getSession, signOut } from "next-auth/react";
import { useRouteGuardStore, ROUTE_GUARD_PRESETS } from "@/store/routeGuardStore";

// Dùng để tránh gọi trùng lắp API session (tránh race-condition khi refresh token song song)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let activeSessionPromise: Promise<any> | null = null;

const getDeduplicatedSession = () => {
  if (!activeSessionPromise) {
    activeSessionPromise = getSession().finally(() => {
      activeSessionPromise = null;
    });
  }
  return activeSessionPromise;
};

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Request interceptor — tự động gắn JWT token
apiClient.interceptors.request.use(
  async (config) => {
    const session = await getDeduplicatedSession();
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — xử lý lỗi toàn cục
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Thử refresh session qua NextAuth trước khi redirect
      const refreshed = await getDeduplicatedSession();
      if (refreshed?.accessToken) {
        originalRequest.headers.Authorization = `Bearer ${refreshed.accessToken}`;
        return apiClient(originalRequest);
      }

      // Token không còn hợp lệ → xóa session và hiển thị modal thay vì redirect thẳng
      await signOut({ redirect: false });
      useRouteGuardStore.getState().showModal(ROUTE_GUARD_PRESETS.SESSION_EXPIRED);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
