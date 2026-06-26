"use client";

import { useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useToggleSave } from "@/hooks/useSavedListings";

interface SaveButtonProps {
  listingId: number;
  initialSaved?: boolean;
  className?: string;
  /** "sm" = 32px touch target, "md" = 40px (mặc định) */
  size?: "sm" | "md";
}

/**
 * Nút lưu/bỏ lưu tin đăng vào wishlist.
 * - Chưa đăng nhập: redirect sang trang đăng nhập.
 * - Đã đăng nhập: toggle ngay (optimistic UI).
 */
export function SaveButton({
  listingId,
  initialSaved = false,
  className,
  size = "md",
}: SaveButtonProps) {
  const { status } = useSession();
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const { mutate: toggleSave, isPending } = useToggleSave();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Đang load session — không làm gì, tránh redirect nhầm
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/auth/login?callbackUrl=" + encodeURIComponent(window.location.pathname));
      return;
    }

    // Optimistic update
    const nextSaved = !saved;
    setSaved(nextSaved);

    toggleSave(listingId, {
      onSuccess: (response) => {
        setSaved(response.data.isSaved);
        if (response.data.isSaved) {
          toast.success("Đã lưu vào danh sách yêu thích", {
            action: {
              label: "Xem danh sách",
              onClick: () => router.push("/app/saved"),
            },
          });
        } else {
          toast.success("Đã xóa khỏi danh sách yêu thích");
        }
      },
      onError: () => {
        // Revert optimistic update
        setSaved(!nextSaved);
      },
    });
  };

  const sizeClasses = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
  };

  const iconSizeClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-4.5 w-4.5",
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      aria-label={saved ? "Bỏ lưu tin đăng" : "Lưu tin đăng"}
      className={cn(
        "flex items-center justify-center rounded-full transition-all duration-200",
        "border border-gray-200 bg-white/90 backdrop-blur-sm",
        "hover:border-red-300 hover:bg-white active:scale-90",
        "shadow-sm cursor-pointer",
        sizeClasses[size],
        className
      )}
    >
      {isPending ? (
        <Loader2 className={cn("animate-spin text-gray-400", iconSizeClasses[size])} />
      ) : (
        <Heart
          className={cn(
            "transition-colors duration-200",
            iconSizeClasses[size],
            saved
              ? "fill-red-500 text-red-500"
              : "fill-transparent text-gray-400 hover:text-red-400"
          )}
        />
      )}
    </button>
  );
}
