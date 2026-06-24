import apiClient from "./axios";
import type { ApiResponse } from "@/types/api.types";
import type {
  LandlordAnalyticsResponse,
  ConversionFunnelDto,
  MonthlyRevenueDto,
  AdminFinancialSummaryDto,
  TopLandlordDto,
} from "@/types/analytics.types";

export const analyticsApi = {
  getLandlordAnalytics: async (): Promise<ApiResponse<LandlordAnalyticsResponse>> => {
    const response = await apiClient.get("/landlord/analytics");
    return response.data;
  },

  getFunnel: async (from: string, to: string): Promise<ApiResponse<ConversionFunnelDto>> => {
    const response = await apiClient.get(`/landlord/analytics/funnel?from=${from}&to=${to}`);
    return response.data;
  },

  getMonthlyRevenue: async (year: number): Promise<ApiResponse<MonthlyRevenueDto[]>> => {
    const response = await apiClient.get(`/landlord/analytics/revenue?year=${year}`);
    return response.data;
  },

  getAdminSummary: async (from: string, to: string): Promise<ApiResponse<AdminFinancialSummaryDto>> => {
    const response = await apiClient.get(`/admin/analytics/summary?from=${from}&to=${to}`);
    return response.data;
  },

  getTopLandlords: async (
    from: string,
    to: string,
    limit: number = 10
  ): Promise<ApiResponse<TopLandlordDto[]>> => {
    const response = await apiClient.get(
      `/admin/analytics/top-landlords?from=${from}&to=${to}&limit=${limit}`
    );
    return response.data;
  },
};
