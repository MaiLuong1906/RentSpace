"use client";

import { Star } from "lucide-react";
import type { Review } from "@/types/review.types";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface ReviewCardProps {
  review: Review;
  onDelete?: (reviewId: number) => void;
  canDelete?: boolean;
}

export function ReviewCard({ review, onDelete, canDelete }: ReviewCardProps) {
  const timeAgo = formatDistanceToNow(new Date(review.createdAt), {
    addSuffix: true,
    locale: vi,
  });

  return (
    <div className="review-card">
      {/* Header: Avatar + Tên + Thời gian */}
      <div className="review-card__header">
        <div className="review-card__avatar">
          {review.author.avatarUrl ? (
            <img
              src={review.author.avatarUrl}
              alt={review.author.fullName}
              className="review-card__avatar-img"
            />
          ) : (
            <div className="review-card__avatar-fallback">
              {review.author.fullName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="review-card__meta">
          <p className="review-card__author">{review.author.fullName}</p>
          <p className="review-card__time">{timeAgo}</p>
        </div>
        {canDelete && onDelete && (
          <button
            className="review-card__delete-btn"
            onClick={() => onDelete(review.id)}
            title="Xóa đánh giá"
          >
            ✕
          </button>
        )}
      </div>

      {/* Rating: Hiển thị sao */}
      <div className="review-card__rating">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={16}
            className={
              i < review.rating
                ? "review-card__star review-card__star--filled"
                : "review-card__star"
            }
          />
        ))}
        <span className="review-card__rating-text">{review.rating}/5</span>
      </div>

      {/* Nội dung bình luận */}
      {review.comment && (
        <p className="review-card__comment">{review.comment}</p>
      )}
    </div>
  );
}
