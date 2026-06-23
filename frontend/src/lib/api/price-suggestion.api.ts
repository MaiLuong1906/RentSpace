import apiClient from "./axios";
import { ApiResponse } from "@/types/api.types";

export interface PriceSuggestionResponse {
  p25Price: number;
  p50Price: number;
  p75Price: number;
  sampleCount: number;
  dataSource: string;
  isFallback: boolean;
}

export const getPriceSuggestion = async (
  city: string,
  district: string,
  roomType: string,
  area: number
): Promise<PriceSuggestionResponse> => {
  const response = await apiClient.get<ApiResponse<PriceSuggestionResponse>>(
    "/price-suggestion",
    {
      params: {
        city,
        district,
        roomType,
        area,
      },
    }
  );
  return response.data.data;
};
