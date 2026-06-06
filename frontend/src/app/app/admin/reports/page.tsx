"use client";

import { useState } from "react";
import { Flag, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useAdminReports, useUpdateReportStatus } from "@/hooks/useReviews";
import { toast } from "sonner";
import type { ReportStatus } from "@/types/review.types";

export default function AdminReportsPage() {
  const [statusFilter, setStatusFilter] = useState<ReportStatus>("PENDING");
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, refetch } = useAdminReports({
    status: statusFilter,
    page,
    size: 10,
  });

  const updateReportStatus = useUpdateReportStatus();

  const reports = data?.data?.content ?? [];
  const totalPages = data?.data?.totalPages ?? data?.data?.page?.totalPages ?? 0;
  const totalElements = data?.data?.totalElements ?? data?.data?.page?.totalElements ?? 0;

  const handleUpdateStatus = async (reportId: number, status: ReportStatus) => {
    const actionText = status === "RESOLVED" ? "Xử lý & Ẩn tin" : "Bỏ qua";
    if (confirm(`Bạn có chắc muốn thực hiện hành động [${actionText}] cho báo cáo này không?`)) {
      try {
        await updateReportStatus.mutateAsync({
          reportId,
          data: { status },
        });
        toast.success(`Đã cập nhật trạng thái báo cáo thành công!`);
        refetch();
      } catch (err: unknown) {
        const apiError = err as { response?: { data?: { message?: string } } };
        toast.error(apiError?.response?.data?.message ?? "Không thể cập nhật báo cáo. Vui lòng thử lại.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý báo cáo vi phạm</h1>
            <p className="text-sm text-gray-500 mt-1">
              Xem và xử lý các báo cáo vi phạm phòng trọ từ người dùng
            </p>
          </div>

          {/* Filter Status */}
          <div className="flex gap-2 bg-gray-200/60 p-1.5 rounded-xl self-start">
            {(["PENDING", "RESOLVED", "DISMISSED"] as ReportStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setPage(0);
                }}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  statusFilter === status
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {status === "PENDING"
                  ? "Chờ xử lý"
                  : status === "RESOLVED"
                  ? "Đã xử lý"
                  : "Đã bỏ qua"}
              </button>
            ))}
          </div>
        </div>

        {/* State Indicators */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-gray-500">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm font-medium">Đang tải danh sách báo cáo...</span>
          </div>
        ) : isError ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-md mx-auto">
            <p className="text-red-600 text-sm font-medium">
              Không thể kết nối danh sách báo cáo. Vui lòng thử lại sau.
            </p>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <Flag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-700 mb-1">
              Không có báo cáo nào
            </h3>
            <p className="text-gray-500 text-sm">
              Tất cả báo cáo ở mục này đã được xử lý xong
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Tổng số báo cáo: {totalElements}
            </p>

            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-lg ${
                      report.status === "PENDING"
                        ? "bg-yellow-50 text-yellow-600"
                        : report.status === "RESOLVED"
                        ? "bg-red-50 text-red-600"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <Flag className="h-6 w-6" />
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          {report.reason}
                        </h3>
                        <p className="text-xs text-gray-500">
                          Báo cáo bởi <strong>{report.reporterName}</strong> (ID: {report.reporterId}) •{" "}
                          {new Date(report.createdAt).toLocaleString("vi-VN")}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full self-start ${
                          report.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : report.status === "RESOLVED"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {report.status === "PENDING"
                          ? "Chờ xử lý"
                          : report.status === "RESOLVED"
                          ? "Đã xử lý & Ẩn tin"
                          : "Đã bỏ qua"}
                      </span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 mb-4 bg-gray-50 p-4 rounded-lg">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Tin đăng bị báo cáo:</div>
                        <div className="font-semibold text-gray-800 text-sm">
                          {report.listingTitle}{" "}
                          <span className="text-xs text-gray-400 font-normal">
                            (ID: {report.listingId})
                          </span>
                        </div>
                      </div>

                      {report.description && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Mô tả chi tiết:</div>
                          <p className="text-gray-700 text-sm whitespace-pre-wrap">
                            {report.description}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action buttons (only visible if status is PENDING) */}
                    {report.status === "PENDING" && (
                      <div className="flex flex-wrap gap-3">
                        <button
                          disabled={updateReportStatus.isPending}
                          onClick={() => handleUpdateStatus(report.id, "DISMISSED")}
                          className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" />
                          Bỏ qua báo cáo
                        </button>
                        <button
                          disabled={updateReportStatus.isPending}
                          onClick={() => handleUpdateStatus(report.id, "RESOLVED")}
                          className="px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Xử lý & Ẩn tin
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-gray-100">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Trước
                </button>
                <span className="text-sm text-gray-500 font-medium">
                  Trang {page + 1} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Tiếp →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
