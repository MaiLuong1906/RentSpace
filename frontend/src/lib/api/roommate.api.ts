import apiClient from "./axios";
import { ApiResponse } from "@/types/api.types";
import { RoommateProfile, RoommateMatch } from "@/types/phase2.types";

export interface RoommateProfileRequest {
  profileType: 'SEEKING_ROOM' | 'HAS_ROOM';
  listingId?: number | null;
  maxOccupants?: number | null;
  currentOccupants?: number | null;
  gender: string;
  occupation: string;
  budgetMin: number;
  budgetMax: number;
  preferredArea: string;
  moveInDate: string;
  lifestyleTags: string[];
  bio?: string;
  isActive?: boolean;
}

export const roommateApi = {
  getProfile: async () => {
    const response = await apiClient.get<ApiResponse<RoommateProfile>>("/roommates/profile");
    return response.data;
  },

  updateProfile: async (data: RoommateProfileRequest) => {
    const response = await apiClient.put<ApiResponse<RoommateProfile>>("/roommates/profile", data);
    return response.data;
  },

  getSuggestions: async () => {
    const response = await apiClient.get<ApiResponse<RoommateMatch[]>>("/roommates/suggestions");
    return response.data;
  },

  dismissMatch: async (matchId: number) => {
    const response = await apiClient.patch<ApiResponse<void>>(`/roommates/matches/${matchId}/dismiss`);
    return response.data;
  },

  expressInterest: async (matchId: number) => {
    const response = await apiClient.patch<ApiResponse<RoommateMatch>>(`/roommates/matches/${matchId}/interested`);
    return response.data;
  },
};
