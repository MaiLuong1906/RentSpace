import apiClient from "./axios";
import type { Listing, ListingSearchParams } from "@/types/listing.types";
import type { ApiResponse } from "@/types/api.types";

export const listingApi = {
  getListings: async (params: ListingSearchParams): Promise<ApiResponse<Listing[]>> => {
    const response = await apiClient.get("/listings", { params });
    return response.data;
  },

  getListingById: async (id: string): Promise<ApiResponse<Listing>> => {
    const response = await apiClient.get(`/listings/${id}`);
    return response.data;
  },

  createListing: async (data: FormData): Promise<ApiResponse<Listing>> => {
    const response = await apiClient.post("/listings", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  updateListing: async (id: string, data: Partial<Listing>): Promise<ApiResponse<Listing>> => {
    const response = await apiClient.put(`/listings/${id}`, data);
    return response.data;
  },

  deleteListing: async (id: string): Promise<void> => {
    await apiClient.delete(`/listings/${id}`);
  },

  getMyListings: async (): Promise<ApiResponse<Listing[]>> => {
    const response = await apiClient.get("/listings/my");
    return response.data;
  },
};
