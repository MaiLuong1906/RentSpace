import apiClient from "./axios";
import { ApiResponse } from "@/types/api.types";
import { RoommateProfile, RoommateMatch } from "@/types/phase2.types";

export const roommateApi = {
  // Lấy hồ sơ ở ghép của tôi
  getProfile: async () => {
    const response = await apiClient.get<ApiResponse<RoommateProfile>>("/roommates/profile");
    return response.data;
  },

  // Cập nhật hồ sơ
  updateProfile: async (data: Partial<RoommateProfile>) => {
    const response = await apiClient.put<ApiResponse<RoommateProfile>>("/roommates/profile", data);
    return response.data;
  },

  // Lấy gợi ý bạn ở ghép
  getSuggestions: async () => {
    const response = await apiClient.get<ApiResponse<RoommateMatch[]>>("/roommates/suggestions");
    return response.data;
  },

  // Đánh dấu không phù hợp
  dismissMatch: async (matchId: number) => {
    const response = await apiClient.patch<ApiResponse<{ matchId: number; status: string }>>(`/roommates/matches/${matchId}/dismiss`);
    return response.data;
  },
};
