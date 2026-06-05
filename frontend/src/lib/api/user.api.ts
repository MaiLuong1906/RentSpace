import apiClient from "./axios";
import type { User } from "@/types/user.types";
import type { ApiResponse } from "@/types/api.types";

export const userApi = {
  // GET /api/v1/users/all — Dev/Admin lấy tất cả người dùng
  getAllUsers: async (): Promise<ApiResponse<User[]>> => {
    const response = await apiClient.get("/users/all");
    return response.data;
  },

  // GET /api/v1/users/{userId} — Xem hồ sơ công khai
  getUserProfile: async (id: string | number): Promise<ApiResponse<User>> => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  // GET /api/v1/users/me — Lấy thông tin hồ sơ của chính mình
  getMyProfile: async (): Promise<ApiResponse<User>> => {
    const response = await apiClient.get("/users/me");
    return response.data;
  },

  // PUT /api/v1/users/me — Cập nhật hồ sơ cá nhân
  updateProfile: async (data: { fullName: string; phoneNumber?: string }): Promise<ApiResponse<User>> => {
    const response = await apiClient.put("/users/me", data);
    return response.data;
  },
};
