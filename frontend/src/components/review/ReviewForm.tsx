"use client";

import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { useCreateReview } from "@/hooks/useReviews";

interface ReviewFormProps {
  listingId: number;
  onSuccess?: () => void;
}

export function ReviewForm({ listingId, onSuccess }: ReviewFormProps) {
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

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <h3 className="review-form__title">Viết đánh giá của bạn</h3>

      {/* Lựa chọn số sao */}
      <div className="review-form__stars">
        <p className="review-form__label">Đánh giá *</p>
        <div className="review-form__star-row">
          {Array.from({ length: 5 }).map((_, i) => {
            const starVal = i + 1;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setRating(starVal)}
                onMouseEnter={() => setHoveredRating(starVal)}
                onMouseLeave={() => setHoveredRating(0)}
                className="review-form__star-btn"
              >
                <Star
                  size={28}
                  className={
                    starVal <= (hoveredRating || rating)
                      ? "review-form__star review-form__star--active"
                      : "review-form__star"
                  }
                />
              </button>
            );
          })}
          {rating > 0 && (
            <span className="review-form__rating-label">
              {["", "Rất tệ", "Tệ", "Bình thường", "Tốt", "Xuất sắc"][rating]}
            </span>
          )}
        </div>
      </div>

      {/* Ô nhập bình luận */}
      <div className="review-form__field">
        <label className="review-form__label" htmlFor="review-comment">
          Bình luận (không bắt buộc)
        </label>
        <textarea
          id="review-comment"
          className="review-form__textarea"
          rows={4}
          maxLength={1000}
          placeholder="Chia sẻ trải nghiệm thuê phòng của bạn..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <p className="review-form__char-count">{comment.length}/1000</p>
      </div>

      {/* Hiển thị lỗi */}
      {error && <p className="review-form__error">{error}</p>}

      <button
        type="submit"
        disabled={createReview.isPending}
        className="review-form__submit"
      >
        {createReview.isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Đang gửi...
          </>
        ) : (
          "Gửi đánh giá"
        )}
      </button>
    </form>
  );
}
