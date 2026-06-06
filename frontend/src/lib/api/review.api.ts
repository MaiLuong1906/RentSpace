import apiClient from "./axios";
import type {
  Review,
  ReviewRequest,
  Report,
  ReportRequest,
  ReportStatus,
  ReportStatusUpdateRequest,
} from "@/types/review.types";
import type { ApiResponse, PageResponse } from "@/types/api.types";

export const reviewApi = {
  // GET /api/v1/listings/{listingId}/reviews — Lấy danh sách reviews (Public)
  getListingReviews: async (
    listingId: number,
    params?: { page?: number; size?: number; sort?: string }
  ): Promise<ApiResponse<PageResponse<Review>>> => {
    const response = await apiClient.get(`/listings/${listingId}/reviews`, {
      params,
    });
    return response.data;
  },

  // POST /api/v1/listings/{listingId}/reviews — Viết review [TENANT]
  createReview: async (
    listingId: number,
    data: ReviewRequest
  ): Promise<ApiResponse<Review>> => {
    const response = await apiClient.post(
      `/listings/${listingId}/reviews`,
      data
    );
    return response.data;
  },

  // PUT /api/v1/reviews/{id} — Sửa review [TENANT]
  updateReview: async (
    reviewId: number,
    data: ReviewRequest
  ): Promise<ApiResponse<Review>> => {
    const response = await apiClient.put(`/reviews/${reviewId}`, data);
    return response.data;
  },

  // DELETE /api/v1/reviews/{id} — Xóa review [TENANT/ADMIN]
  deleteReview: async (reviewId: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/reviews/${reviewId}`);
    return response.data;
  },
};

export const reportApi = {
  // POST /api/v1/reports — Gửi báo cáo vi phạm [AUTHENTICATED]
  submitReport: async (
    data: ReportRequest
  ): Promise<ApiResponse<Report>> => {
    const response = await apiClient.post("/reports", data);
    return response.data;
  },

  // GET /api/v1/admin/reports — Lấy danh sách báo cáo [ADMIN]
  getAdminReports: async (params?: {
    status?: ReportStatus;
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<ApiResponse<PageResponse<Report>>> => {
    const response = await apiClient.get("/admin/reports", { params });
    return response.data;
  },

  // PATCH /api/v1/admin/reports/{id} — Cập nhật trạng thái báo cáo [ADMIN]
  updateReportStatus: async (
    reportId: number,
    data: ReportStatusUpdateRequest
  ): Promise<ApiResponse<Report>> => {
    const response = await apiClient.patch(`/admin/reports/${reportId}`, data);
    return response.data;
  },
};
