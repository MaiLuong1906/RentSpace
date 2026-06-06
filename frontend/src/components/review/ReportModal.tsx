"use client";

import { useState } from "react";
import { Flag, Loader2, X, CheckCircle2 } from "lucide-react";
import { useSubmitReport } from "@/hooks/useReviews";

interface ReportModalProps {
  listingId: number;
  listingTitle: string;
  onClose: () => void;
}

const REPORT_REASONS = [
  "Thông tin sai lệch",
  "Hình ảnh không đúng thực tế",
  "Giá cả không đúng",
  "Phòng trọ đã cho thuê nhưng vẫn đăng",
  "Nội dung không phù hợp",
  "Tin đăng lừa đảo",
  "Lý do khác",
];

export function ReportModal({ listingId, listingTitle, onClose }: ReportModalProps) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitReport = useSubmitReport();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reason) {
      setError("Vui lòng chọn lý do báo cáo");
      return;
    }

    try {
      await submitReport.mutateAsync({ listingId, reason, description: description.trim() || undefined });
      setSubmitted(true);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setError(apiError?.response?.data?.message ?? "Không thể gửi báo cáo. Vui lòng thử lại.");
    }
  };

  return (
    /* Overlay */
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      {/* Modal */}
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-red-600">
            <Flag size={18} />
            <h3 className="font-bold text-gray-900">Báo cáo vi phạm</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          /* ✅ Trạng thái thành công */
          <div className="px-6 py-10 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">Báo cáo đã được gửi!</h4>
            <p className="text-sm text-gray-500 mb-6">
              Cảm ơn bạn đã phản ánh. Đội ngũ kiểm duyệt sẽ xem xét trong thời gian sớm nhất.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-colors"
            >
              Đóng
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5">
            {/* Tên phòng trọ */}
            <p className="text-xs text-gray-500 mb-4">
              Phòng trọ: <span className="font-semibold text-gray-700">{listingTitle}</span>
            </p>

            {/* Lý do */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Lý do báo cáo *</p>
              <div className="space-y-2">
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      reason === r
                        ? "border-red-400 bg-red-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r}
                      checked={reason === r}
                      onChange={() => setReason(r)}
                      className="text-red-500 accent-red-500"
                    />
                    <span className="text-sm text-gray-700">{r}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Mô tả */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Mô tả chi tiết <span className="text-gray-400 font-normal">(không bắt buộc)</span>
              </label>
              <textarea
                rows={3}
                maxLength={1000}
                placeholder="Mô tả chi tiết về vi phạm..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none"
              />
              <p className="text-right text-xs text-gray-400 mt-1">{description.length}/1000</p>
            </div>

            {/* Lỗi */}
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
                {error}
              </p>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-sm border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitReport.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {submitReport.isPending ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  "Gửi báo cáo"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
