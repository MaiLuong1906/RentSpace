"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reviewApi, reportApi } from "@/lib/api/review.api";
import type { ReviewRequest, ReportRequest, ReportStatus, ReportStatusUpdateRequest } from "@/types/review.types";

// ============================================================
// REVIEW HOOKS
// ============================================================

/**
 * Hook lấy danh sách đánh giá phòng trọ (phân trang, public).
 */
export function useListingReviews(
  listingId: number,
  params?: { page?: number; size?: number; sort?: string }
) {
  return useQuery({
    queryKey: ["reviews", listingId, params],
    queryFn: () => reviewApi.getListingReviews(listingId, params),
    enabled: !!listingId,
    staleTime: 1000 * 60 * 2, // 2 phút
  });
}

/**
 * Hook viết đánh giá mới [TENANT].
 * Tự động làm mới danh sách đánh giá sau khi tạo thành công.
 */
export function useCreateReview(listingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ReviewRequest) => reviewApi.createReview(listingId, data),
    onSuccess: () => {
      // Làm mới cache danh sách reviews của phòng trọ này
      queryClient.invalidateQueries({ queryKey: ["reviews", listingId] });
    },
  });
}

/**
 * Hook cập nhật đánh giá [TENANT].
 */
export function useUpdateReview(listingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, data }: { reviewId: number; data: ReviewRequest }) =>
      reviewApi.updateReview(reviewId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", listingId] });
    },
  });
}

/**
 * Hook xóa đánh giá [TENANT/ADMIN].
 */
export function useDeleteReview(listingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: number) => reviewApi.deleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", listingId] });
    },
  });
}

// ============================================================
// REPORT HOOKS
// ============================================================

/**
 * Hook gửi báo cáo vi phạm phòng trọ [AUTHENTICATED].
 */
export function useSubmitReport() {
  return useMutation({
    mutationFn: (data: ReportRequest) => reportApi.submitReport(data),
  });
}

/**
 * Hook lấy danh sách báo cáo vi phạm [ADMIN].
 */
export function useAdminReports(params?: {
  status?: ReportStatus;
  page?: number;
  size?: number;
}) {
  return useQuery({
    queryKey: ["admin-reports", params],
    queryFn: () => reportApi.getAdminReports(params),
    staleTime: 1000 * 30, // 30 giây
  });
}

/**
 * Hook cập nhật trạng thái báo cáo [ADMIN].
 */
export function useUpdateReportStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, data }: { reportId: number; data: ReportStatusUpdateRequest }) =>
      reportApi.updateReportStatus(reportId, data),
    onSuccess: () => {
      // Làm mới toàn bộ cache danh sách báo cáo
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    },
  });
}
