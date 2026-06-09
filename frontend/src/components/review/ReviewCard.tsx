"use client";

import { useState } from "react";
import { Star, Trash2, Pencil, Check, X, Loader2 } from "lucide-react";
import type { Review } from "@/types/review.types";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useUpdateReview } from "@/hooks/useReviews";

interface ReviewCardProps {
  review: Review;
  listingId: number;
  onDelete?: (reviewId: number) => void;
  canDelete?: boolean;
  canEdit?: boolean;
}

const RATING_LABELS = ["", "Rất tệ", "Tệ", "Bình thường", "Tốt", "Xuất sắc"];

export function ReviewCard({ review, listingId, onDelete, canDelete, canEdit }: ReviewCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editRating, setEditRating] = useState(review.rating);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [editComment, setEditComment] = useState(review.comment ?? "");
  const [editError, setEditError] = useState<string | null>(null);

  const updateReview = useUpdateReview(listingId);

  const timeAgo = formatDistanceToNow(new Date(review.createdAt), {
    addSuffix: true,
    locale: vi,
  });

  const handleSave = async () => {
    setEditError(null);
    if (editRating === 0) {
      setEditError("Vui lòng chọn số sao");
      return;
    }
    try {
      await updateReview.mutateAsync({
        reviewId: review.id,
        data: { rating: editRating, comment: editComment.trim() || undefined },
      });
      setIsEditing(false);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setEditError(apiError?.response?.data?.message ?? "Không thể cập nhật. Thử lại sau.");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditRating(review.rating);
    setEditComment(review.comment ?? "");
    setEditError(null);
  };

  const displayRating = hoveredRating || editRating;

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow">
      {/* Header: Avatar + Tên + Thời gian + Actions */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {review.author.avatarUrl ? (
            <img
              src={review.author.avatarUrl}
              alt={review.author.fullName}
              className="w-10 h-10 rounded-full object-cover border border-gray-200 flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-base flex-shrink-0">
              {review.author.fullName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900 text-sm">{review.author.fullName}</p>
            <p className="text-xs text-gray-400">{timeAgo}</p>
          </div>
        </div>

        {/* Action buttons */}
        {!isEditing && (
          <div className="flex items-center gap-1">
            {canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                title="Chỉnh sửa đánh giá"
              >
                <Pencil size={15} />
              </button>
            )}
            {canDelete && onDelete && (
              <button
                onClick={() => onDelete(review.id)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Xóa đánh giá"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ===== CHẾ ĐỘ XEM ===== */}
      {!isEditing && (
        <>
          <div className="flex items-center gap-1 mb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={15}
                className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}
              />
            ))}
            <span className="text-xs text-gray-500 ml-1 font-medium">{review.rating}/5</span>
          </div>

          {/* Đánh giá chi tiết — chỉ hiển thị nếu có ít nhất 1 tiêu chí */}
          {(review.cleanlinessRating || review.securityRating || review.landlordRating) && (
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 mb-3 text-xs">
              {review.cleanlinessRating && (
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400">🧹 Vệ sinh</span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={10} className={i < review.cleanlinessRating! ? "fill-emerald-400 text-emerald-400" : "text-gray-200"} />
                    ))}
                  </div>
                </div>
              )}
              {review.securityRating && (
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400">🔒 An ninh</span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={10} className={i < review.securityRating! ? "fill-blue-400 text-blue-400" : "text-gray-200"} />
                    ))}
                  </div>
                </div>
              )}
              {review.landlordRating && (
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400">🤝 Chủ trọ</span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={10} className={i < review.landlordRating! ? "fill-purple-400 text-purple-400" : "text-gray-200"} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {review.comment && (
            <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
          )}
        </>
      )}

      {/* ===== CHẾ ĐỘ CHỈNH SỬA ===== */}
      {isEditing && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mt-1">
          {/* Star picker */}
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-600 mb-1.5">Đánh giá của bạn</p>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => {
                const val = i + 1;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setEditRating(val)}
                    onMouseEnter={() => setHoveredRating(val)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      size={22}
                      className={
                        val <= displayRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }
                    />
                  </button>
                );
              })}
              {displayRating > 0 && (
                <span className="ml-2 text-xs font-semibold text-blue-600">
                  {RATING_LABELS[displayRating]}
                </span>
              )}
            </div>
          </div>

          {/* Textarea */}
          <textarea
            rows={2}
            maxLength={1000}
            value={editComment}
            onChange={(e) => setEditComment(e.target.value)}
            placeholder="Chỉnh sửa bình luận của bạn..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white mb-2"
          />
          <p className="text-right text-xs text-gray-400 mb-2">{editComment.length}/1000</p>

          {/* Lỗi */}
          {editError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 mb-2">
              {editError}
            </p>
          )}

          {/* Save / Cancel */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <X size={13} />
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={updateReview.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors font-medium"
            >
              {updateReview.isPending ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Check size={13} />
                  Lưu thay đổi
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
