import apiClient from "./axios";
import type {
  Listing,
  ListingImage,
  ListingSearchParams,
  NearbySearchParams,
  CreateListingRequest,
  UpdateListingStatusRequest,
} from "@/types/listing.types";
import type { ApiResponse, PageResponse } from "@/types/api.types";

export const listingApi = {
  // GET /api/v1/listings — Tìm kiếm, lọc, phân trang
  getListings: async (params: ListingSearchParams): Promise<ApiResponse<PageResponse<Listing>>> => {
    const response = await apiClient.get("/listings", { params });
    return response.data;
  },

  // GET /api/v1/listings/{id} — Chi tiết 1 tin
  getListingById: async (id: string | number): Promise<ApiResponse<Listing>> => {
    const response = await apiClient.get(`/listings/${id}`);
    return response.data;
  },

  // GET /api/v1/listings/my — Tin đăng của landlord đang đăng nhập
  getMyListings: async (params?: Pick<ListingSearchParams, "page" | "size" | "sort">): Promise<ApiResponse<PageResponse<Listing>>> => {
    const response = await apiClient.get("/listings/my", { params });
    return response.data;
  },

  // GET /api/v1/listings/nearby — Tìm theo tọa độ
  findNearby: async (params: NearbySearchParams): Promise<ApiResponse<Listing[]>> => {
    const response = await apiClient.get("/listings/nearby", { params });
    return response.data;
  },

  // POST /api/v1/listings — Tạo tin mới [LANDLORD] — backend nhận JSON
  createListing: async (data: CreateListingRequest): Promise<ApiResponse<Listing>> => {
    const response = await apiClient.post("/listings", data);
    return response.data;
  },

  // PUT /api/v1/listings/{id} — Cập nhật tin [LANDLORD]
  updateListing: async (id: string | number, data: CreateListingRequest): Promise<ApiResponse<Listing>> => {
    const response = await apiClient.put(`/listings/${id}`, data);
    return response.data;
  },

  // PATCH /api/v1/listings/{id}/status — Đổi trạng thái [LANDLORD]
  updateListingStatus: async (id: string | number, data: UpdateListingStatusRequest): Promise<ApiResponse<Listing>> => {
    const response = await apiClient.patch(`/listings/${id}/status`, data);
    return response.data;
  },

  // DELETE /api/v1/listings/{id} — Xóa tin [LANDLORD hoặc ADMIN]
  deleteListing: async (id: string | number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/listings/${id}`);
    return response.data;
  },

  // POST /api/v1/listings/{id}/images — Upload ảnh (multipart)
  uploadImage: async (id: string | number, imageFile: File): Promise<ApiResponse<ListingImage>> => {
    const formData = new FormData();
    formData.append("image", imageFile);
    const response = await apiClient.post(`/listings/${id}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // DELETE /api/v1/listings/{id}/images/{imageId} — Xóa ảnh
  deleteImage: async (listingId: string | number, imageId: string | number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/listings/${listingId}/images/${imageId}`);
    return response.data;
  },
};
