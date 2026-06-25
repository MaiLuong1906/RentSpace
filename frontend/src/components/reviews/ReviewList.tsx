"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star, Loader2 } from "lucide-react";
import Image from "next/image";
import { transactionReviewApi, TransactionReviewItem } from "@/lib/api/transaction-review.api";
import { RatingSummaryCard } from "./RatingSummaryCard";

type RoleFilter = "all" | "TENANT" | "LANDLORD";

function ReviewCard({ review }: { review: TransactionReviewItem }) {
  return (
    <div className="flex gap-3 py-4 border-b border-gray-100 last:border-0">
      <div className="shrink-0">
        {review.reviewerAvatarUrl ? (
          <Image
            src={review.reviewerAvatarUrl}
            alt={review.reviewerName}
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
            {review.reviewerName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-gray-900 truncate">{review.reviewerName}</span>
          <div className="flex shrink-0">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`h-3.5 w-3.5 ${s <= review.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
              />
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          {review.reviewerRole === "TENANT" ? "Người thuê" : "Chủ trọ"}
          {" · "}
          {review.publishedAt
            ? new Date(review.publishedAt).toLocaleDateString("vi-VN")
            : ""}
        </p>
        {review.comment && (
          <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">{review.comment}</p>
        )}
      </div>
    </div>
  );
}

interface ReviewListProps {
  userId: number;
}

export function ReviewList({ userId }: ReviewListProps) {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const { data: summaryRes, isLoading: summaryLoading } = useQuery({
    queryKey: ["rating-summary", userId],
    queryFn: () => transactionReviewApi.getRatingSummary(userId),
  });

  const { data: reviewsRes, isLoading: reviewsLoading } = useQuery({
    queryKey: ["user-reviews", userId],
    queryFn: () => transactionReviewApi.getUserReviews(userId, 0, 50),
  });

  const summary = summaryRes?.data;
  const allReviews = reviewsRes?.data?.content ?? [];
  const reviews = roleFilter === "all"
    ? allReviews
    : allReviews.filter((r) => r.reviewerRole === roleFilter);

  if (summaryLoading || reviewsLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
      </div>
    );
  }

  if (!summary || summary.totalReviews === 0) {
    return (
      <p className="py-6 text-center text-sm text-gray-400">
        Chưa có đánh giá nào.
      </p>
    );
  }

  const tabs: { key: RoleFilter; label: string }[] = [
    { key: "all", label: "Tất cả" },
    { key: "TENANT", label: "Với tư cách Chủ trọ" },
    { key: "LANDLORD", label: "Với tư cách Người thuê" },
  ];

  return (
    <div className="space-y-5">
      <RatingSummaryCard summary={summary} />

      <div className="flex gap-2 border-b border-gray-100 pb-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setRoleFilter(tab.key)}
            className={`pb-2.5 px-1 text-sm font-medium border-b-2 transition-colors ${
              roleFilter === tab.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {reviews.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">
            Chưa có đánh giá nào trong mục này.
          </p>
        ) : (
          reviews.map((r) => <ReviewCard key={r.id} review={r} />)
        )}
      </div>
    </div>
  );
}
