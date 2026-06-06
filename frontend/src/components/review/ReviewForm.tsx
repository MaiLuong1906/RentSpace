"use client";

import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { useCreateReview } from "@/hooks/useReviews";

interface ReviewFormProps {
  listingId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const RATING_LABELS = ["", "Rất tệ", "Tệ", "Bình thường", "Tốt", "Xuất sắc"];

export function ReviewForm({ listingId, onSuccess, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createReview = useCreateReview(listingId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (rating === 0) {
      setError("Vui lòng chọn số sao đánh giá");
      return;
    }

    try {
      await createReview.mutateAsync({ rating, comment: comment.trim() || undefined });
      setRating(0);
      setComment("");
      onSuccess?.();
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setError(apiError?.response?.data?.message ?? "Không thể gửi đánh giá. Vui lòng thử lại.");
    }
  };

  const displayRating = hoveredRating || rating;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-6"
    >
      <h3 className="text-base font-semibold text-gray-800 mb-4">Viết đánh giá của bạn</h3>

      {/* Chọn số sao */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Đánh giá *</p>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => {
            const starVal = i + 1;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setRating(starVal)}
                onMouseEnter={() => setHoveredRating(starVal)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-0.5 transition-transform hover:scale-110"
              >
                <Star
                  size={28}
                  className={
                    starVal <= displayRating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }
                />
              </button>
            );
          })}
          {displayRating > 0 && (
            <span className="ml-2 text-sm font-semibold text-blue-600">
              {RATING_LABELS[displayRating]}
            </span>
          )}
        </div>
      </div>

      {/* Textarea bình luận */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="review-comment">
          Bình luận <span className="text-gray-400 font-normal">(không bắt buộc)</span>
        </label>
        <textarea
          id="review-comment"
          rows={3}
          maxLength={1000}
          placeholder="Chia sẻ trải nghiệm thuê phòng của bạn..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white"
        />
        <p className="text-right text-xs text-gray-400 mt-1">{comment.length}/1000</p>
      </div>

      {/* Lỗi */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
          {error}
        </p>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-sm border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
        )}
        <button
          type="submit"
          disabled={createReview.isPending}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {createReview.isPending ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Đang gửi...
            </>
          ) : (
            "Gửi đánh giá"
          )}
        </button>
      </div>
    </form>
  );
}
