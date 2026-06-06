"use client";

import { Star, Trash2 } from "lucide-react";
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
    <div className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
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

        {/* Nút xóa */}
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

      {/* Rating sao */}
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

      {/* Bình luận */}
      {review.comment && (
        <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
      )}
    </div>
  );
}
