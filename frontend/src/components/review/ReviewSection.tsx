"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Star, MessageSquare, Loader2, PenSquare } from "lucide-react";
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
    <section className="bg-white rounded-xl shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">
            Đánh giá ({totalElements})
          </h2>
          {avgRating && (
            <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-200 text-yellow-700 px-2.5 py-1 rounded-full ml-1">
              <Star size={13} className="fill-yellow-500 text-yellow-500" />
              <span className="text-sm font-bold">{avgRating}</span>
            </div>
          )}
        </div>

        {/* Nút viết đánh giá — chỉ hiện với Tenant đã đăng nhập */}
        {isTenant && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PenSquare size={15} />
            Viết đánh giá
          </button>
        )}
      </div>

      {/* Form viết đánh giá */}
      {showForm && isTenant && (
        <ReviewForm
          listingId={listingId}
          onSuccess={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Danh sách reviews */}
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-gray-500">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">Đang tải đánh giá...</span>
        </div>
      ) : isError ? (
        <p className="text-center text-sm text-red-500 py-8">
          Không thể tải đánh giá. Vui lòng thử lại.
        </p>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10">
          <MessageSquare className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium">Chưa có đánh giá nào</p>
          {isTenant && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-blue-600 text-sm font-semibold hover:underline"
            >
              Hãy là người đầu tiên đánh giá!
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                listingId={listingId}
                canEdit={isTenant && review.author.id === Number(session?.user?.id)}
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
            <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-gray-100">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Trước
              </button>
              <span className="text-sm text-gray-500">
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
        </>
      )}
    </section>
  );
}
