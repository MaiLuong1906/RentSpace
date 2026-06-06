"use client";

import { useState } from "react";
import { Flag, Loader2, X } from "lucide-react";
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
    <div className="report-modal__overlay" onClick={onClose}>
      <div className="report-modal" onClick={(e) => e.stopPropagation()} role="dialog">
        {/* Header */}
        <div className="report-modal__header">
          <div className="report-modal__title-row">
            <Flag size={18} className="report-modal__icon" />
            <h3 className="report-modal__title">Báo cáo vi phạm</h3>
          </div>
          <button className="report-modal__close" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          /* Trạng thái đã gửi thành công */
          <div className="report-modal__success">
            <div className="report-modal__success-icon">✓</div>
            <p className="report-modal__success-title">Báo cáo đã được gửi!</p>
            <p className="report-modal__success-desc">
              Cảm ơn bạn đã phản ánh. Đội ngũ kiểm duyệt sẽ xem xét và xử lý trong thời gian sớm nhất.
            </p>
            <button className="report-modal__close-btn" onClick={onClose}>
              Đóng
            </button>
          </div>
        ) : (
          <form className="report-modal__form" onSubmit={handleSubmit}>
            <p className="report-modal__listing-name">
              Phòng trọ: <strong>{listingTitle}</strong>
            </p>

            {/* Lý do báo cáo */}
            <div className="report-modal__field">
              <label className="report-modal__label">Lý do báo cáo *</label>
              <div className="report-modal__reasons">
                {REPORT_REASONS.map((r) => (
                  <label key={r} className="report-modal__reason-option">
                    <input
                      type="radio"
                      name="reason"
                      value={r}
                      checked={reason === r}
                      onChange={() => setReason(r)}
                    />
                    <span>{r}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Mô tả chi tiết */}
            <div className="report-modal__field">
              <label className="report-modal__label" htmlFor="report-description">
                Mô tả chi tiết (không bắt buộc)
              </label>
              <textarea
                id="report-description"
                className="report-modal__textarea"
                rows={4}
                maxLength={1000}
                placeholder="Mô tả chi tiết về vi phạm bạn muốn báo cáo..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <p className="report-modal__char-count">{description.length}/1000</p>
            </div>

            {/* Hiển thị lỗi */}
            {error && <p className="report-modal__error">{error}</p>}

            {/* Actions */}
            <div className="report-modal__actions">
              <button type="button" className="report-modal__cancel-btn" onClick={onClose}>
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitReport.isPending}
                className="report-modal__submit-btn"
              >
                {submitReport.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
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
