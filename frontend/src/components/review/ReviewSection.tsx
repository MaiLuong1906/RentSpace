"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Star, MessageSquare, Loader2 } from "lucide-react";
import { useListingReviews, useDeleteReview } from "@/hooks/useReviews";
import { ReviewCard } from "./ReviewCard";
import { ReviewForm } from "./ReviewForm";

interface ReviewSectionProps {
  listingId: number;
}

export function ReviewSection({ listingId }: ReviewSectionProps) {
  const { data: session } = useSession();
  const [page, setPage] = useState(0);
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading, isError } = useListingReviews(listingId, {
    page,
    size: 10,
    sort: "createdAt,desc",
  });

  const deleteReview = useDeleteReview(listingId);

  const reviews = data?.data?.content ?? [];
  const totalPages = data?.data?.page?.totalPages ?? 0;
  const totalElements = data?.data?.page?.totalElements ?? 0;

  // Tính điểm trung bình
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  const isTenant = session?.user?.role === "TENANT";
  const isAdmin = session?.user?.role === "ADMIN";

  const handleDelete = async (reviewId: number) => {
    if (confirm("Bạn có chắc muốn xóa đánh giá này không?")) {
      await deleteReview.mutateAsync(reviewId);
    }
  };

  return (
    <section className="review-section" id="reviews">
      {/* Header */}
      <div className="review-section__header">
        <div className="review-section__title-row">
          <MessageSquare size={20} />
          <h2 className="review-section__title">
            Đánh giá ({totalElements})
          </h2>
          {avgRating && (
            <div className="review-section__avg">
              <Star size={16} className="review-section__avg-star" />
              <span>{avgRating}</span>
            </div>
          )}
        </div>

        {/* Nút viết đánh giá — chỉ hiển thị với Tenant đã đăng nhập */}
        {isTenant && !showForm && (
          <button
            className="review-section__write-btn"
            onClick={() => setShowForm(true)}
          >
            Viết đánh giá
          </button>
        )}
      </div>

      {/* Form viết đánh giá */}
      {showForm && isTenant && (
        <ReviewForm
          listingId={listingId}
          onSuccess={() => setShowForm(false)}
        />
      )}

      {/* Danh sách reviews */}
      {isLoading ? (
        <div className="review-section__loading">
          <Loader2 size={24} className="animate-spin" />
          <span>Đang tải đánh giá...</span>
        </div>
      ) : isError ? (
        <p className="review-section__error">Không thể tải đánh giá. Vui lòng thử lại.</p>
      ) : reviews.length === 0 ? (
        <div className="review-section__empty">
          <p>Chưa có đánh giá nào cho phòng trọ này.</p>
          {isTenant && !showForm && (
            <button
              className="review-section__write-btn review-section__write-btn--empty"
              onClick={() => setShowForm(true)}
            >
              Hãy là người đầu tiên đánh giá!
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="review-section__list">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                canDelete={
                  isAdmin ||
                  (isTenant && review.author.id === Number(session?.user?.id))
                }
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="review-section__pagination">
              <button
                className="review-section__page-btn"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Trước
              </button>
              <span className="review-section__page-info">
                Trang {page + 1} / {totalPages}
              </span>
              <button
                className="review-section__page-btn"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Tiếp →
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
