"use client";

import { Star } from "lucide-react";
import { RatingSummary } from "@/lib/api/transaction-review.api";

interface RatingSummaryCardProps {
  summary: RatingSummary;
}

function StarBar({ count, total, stars }: { count: number; total: number; stars: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-3 text-right text-gray-500">{stars}</span>
      <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-400 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-right text-gray-400">{count}</span>
    </div>
  );
}

export function RatingSummaryCard({ summary }: RatingSummaryCardProps) {
  const avg = typeof summary.averageRating === "number"
    ? summary.averageRating
    : parseFloat(String(summary.averageRating));

  return (
    <div className="flex items-start gap-6">
      {/* Điểm tổng */}
      <div className="flex flex-col items-center shrink-0">
        <span className="text-4xl font-bold tracking-tight text-gray-900">
          {avg.toFixed(1)}
        </span>
        <div className="flex mt-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`h-4 w-4 ${s <= Math.round(avg) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
            />
          ))}
        </div>
        <span className="text-xs text-gray-400 mt-1">{summary.totalReviews} đánh giá</span>
      </div>

      {/* Biểu đồ thanh */}
      <div className="flex-1 space-y-1.5">
        {[5, 4, 3, 2, 1].map((s) => {
          const countKey = `rating${s}Count` as keyof RatingSummary;
          return (
            <StarBar
              key={s}
              stars={s}
              count={summary[countKey] as number}
              total={summary.totalReviews}
            />
          );
        })}
      </div>
    </div>
  );
}
