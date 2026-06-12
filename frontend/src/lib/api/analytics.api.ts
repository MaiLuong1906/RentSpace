import apiClient from "./axios";
import type { ApiResponse } from "@/types/api.types";
import type { LandlordAnalyticsResponse } from "@/types/analytics.types";

export const analyticsApi = {
  getLandlordAnalytics: async (): Promise<ApiResponse<LandlordAnalyticsResponse>> => {
    const response = await apiClient.get("/landlord/analytics");
    return response.data;
  },
};
