// ============================================================
// Types đồng bộ với Backend DTOs — Reviews & Reports
// ============================================================

// --- Tác giả đánh giá (khớp ReviewAuthorResponse.java) ---
export interface ReviewAuthor {
  id: number;
  fullName: string;
  avatarUrl?: string;
}

// --- Đánh giá phòng trọ (khớp ReviewResponse.java) ---
export interface Review {
  id: number;
  listingId: number;
  author: ReviewAuthor;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

// --- Request tạo/cập nhật đánh giá (khớp ReviewRequest.java) ---
export interface ReviewRequest {
  rating: number;   // 1-5 sao
  comment?: string; // tối đa 1000 ký tự
}

// --- Trạng thái báo cáo (khớp ReportStatus.java enum) ---
export type ReportStatus = "PENDING" | "RESOLVED" | "DISMISSED";

// --- Báo cáo vi phạm (khớp ReportResponse.java) ---
export interface Report {
  id: number;
  listingId: number;
  listingTitle: string;
  reporterId: number;
  reporterName: string;
  reason: string;
  description?: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
}

// --- Request gửi báo cáo (khớp ReportRequest.java) ---
export interface ReportRequest {
  listingId: number;
  reason: string;       // tối đa 100 ký tự
  description?: string; // tối đa 1000 ký tự
}

// --- Request admin cập nhật trạng thái báo cáo ---
export interface ReportStatusUpdateRequest {
  status: ReportStatus;
}
