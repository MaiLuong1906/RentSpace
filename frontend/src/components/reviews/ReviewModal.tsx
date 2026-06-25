"use client";

import { useState } from "react";
import { Star, Loader2, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { transactionReviewApi } from "@/lib/api/transaction-review.api";

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  depositId: number;
  /** Tên người được đánh giá */
  revieweeName: string;
}

export function ReviewModal({
  open,
  onClose,
  onSuccess,
  depositId,
  revieweeName,
}: ReviewModalProps) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState<number>(0);
  const [hovered, setHovered] = useState<number>(0);
  const [comment, setComment] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      transactionReviewApi.submit({
        depositId,
        rating: rating as 1 | 2 | 3 | 4 | 5,
        comment: comment.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Đánh giá đã được gửi. Sẽ hiển thị khi đối phương cũng gửi đánh giá.");
      queryClient.invalidateQueries({ queryKey: ["user-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["rating-summary"] });
      onSuccess?.();
      onClose();
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? "Gửi đánh giá thất bại. Vui lòng thử lại.");
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error("Vui lòng chọn số sao trước khi gửi.");
      return;
    }
    mutate();
  };

  const starLabel = ["", "Rất tệ", "Tệ", "Bình thường", "Tốt", "Rất tốt"];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">
            Đánh giá {revieweeName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {/* Chọn sao */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onMouseEnter={() => setHovered(s)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(s)}
                  aria-label={`${s} sao`}
                >
                  <Star
                    className={`h-9 w-9 transition-colors ${
                      s <= (hovered || rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-200"
                    }`}
                  />
                </button>
              ))}
            </div>
            {(hovered || rating) > 0 && (
              <span className="text-sm font-medium text-gray-600">
                {starLabel[hovered || rating]}
              </span>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nhận xét <span className="text-gray-400 font-normal">(tùy chọn)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Chia sẻ trải nghiệm của bạn..."
              className="w-full resize-none rounded-xl border border-gray-200 p-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <p className="mt-1 text-right text-xs text-gray-400">{comment.length}/500</p>
          </div>

          <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
            Đánh giá sẽ được hiển thị sau khi cả 2 bên đã gửi, hoặc sau 30 ngày.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Để sau
            </button>
            <button
              disabled={isPending || rating === 0}
              onClick={handleSubmit}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gửi đánh giá"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
