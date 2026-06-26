import apiClient from "./axios";
import type { ListingSummary } from "@/types/listing.types";
import type { ApiResponse } from "@/types/api.types";

export const recommendationApi = {
  // GET /api/v1/recommendations/similar/{listingId} — public
  getSimilar: async (listingId: number, limit = 6): Promise<ApiResponse<ListingSummary[]>> => {
    const response = await apiClient.get(`/recommendations/similar/${listingId}`, {
      params: { limit },
    });
    return response.data;
  },

  // GET /api/v1/recommendations/for-you — cần JWT
  getForYou: async (limit = 12): Promise<ApiResponse<ListingSummary[]>> => {
    const response = await apiClient.get("/recommendations/for-you", {
      params: { limit },
    });
    return response.data;
  },

  // GET /api/v1/recommendations/trending — public
  getTrending: async (limit = 12): Promise<ApiResponse<ListingSummary[]>> => {
    const response = await apiClient.get("/recommendations/trending", {
      params: { limit },
    });
    return response.data;
  },
};
