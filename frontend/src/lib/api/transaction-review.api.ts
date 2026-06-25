import apiClient from "./axios";
import { ApiResponse } from "@/types/api.types";

export type ReviewerRole = "TENANT" | "LANDLORD";

export interface SubmitReviewRequest {
  depositId: number;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
}

export interface TransactionReviewItem {
  id: number;
  depositId: number;
  reviewerId: number;
  reviewerName: string;
  reviewerAvatarUrl?: string;
  reviewerRole: ReviewerRole;
  rating: number;
  comment?: string;
  isPublished: boolean;
  publishedAt?: string;
  isFlagged: boolean;
  createdAt: string;
}

export interface RatingSummary {
  userId: number;
  totalReviews: number;
  averageRating: number;
  rating1Count: number;
  rating2Count: number;
  rating3Count: number;
  rating4Count: number;
  rating5Count: number;
}

export interface PagedReviews {
  content: TransactionReviewItem[];
  page: { totalElements: number; totalPages: number; number: number };
}

export interface PendingReviewInfo {
  depositId: number;
  revieweeId: number;
  revieweeName: string;
  revieweeAvatarUrl?: string;
  depositStatus: string;
  completedAt: string;
}

export const transactionReviewApi = {
  submit: (data: SubmitReviewRequest): Promise<ApiResponse<TransactionReviewItem>> =>
    apiClient.post("/transaction-reviews", data).then((r) => r.data),

  getUserReviews: (userId: number, page = 0, size = 10): Promise<ApiResponse<PagedReviews>> =>
    apiClient
      .get(`/transaction-reviews/users/${userId}`, { params: { page, size, sort: "publishedAt,desc" } })
      .then((r) => r.data),

  getRatingSummary: (userId: number): Promise<ApiResponse<RatingSummary>> =>
    apiClient.get(`/transaction-reviews/users/${userId}/rating-summary`).then((r) => r.data),

  getMyPending: (): Promise<ApiResponse<PendingReviewInfo[]>> =>
    apiClient.get("/transaction-reviews/my-pending").then((r) => r.data),
};
