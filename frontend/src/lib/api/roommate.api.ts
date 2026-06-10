import apiClient from "./axios";
import { ApiResponse } from "@/types/api.types";

export const roommateApi = {
  // Lấy hồ sơ ở ghép của tôi
  getProfile: async () => {
    const response = await apiClient.get<ApiResponse<any>>("/roommates/profile");
    return response.data;
  },

  // Cập nhật hồ sơ
  updateProfile: async (data: any) => {
    const response = await apiClient.put<ApiResponse<any>>("/roommates/profile", data);
    return response.data;
  },

  // Lấy gợi ý bạn ở ghép
  getSuggestions: async () => {
    const response = await apiClient.get<ApiResponse<any[]>>("/roommates/suggestions");
    return response.data;
  },

  // Đánh dấu không phù hợp
  dismissMatch: async (matchId: number) => {
    const response = await apiClient.patch<ApiResponse<any>>(`/roommates/matches/${matchId}/dismiss`);
    return response.data;
  },
};
