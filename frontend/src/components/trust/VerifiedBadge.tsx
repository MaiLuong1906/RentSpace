"use client";

import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  /** Khi false hoặc undefined, component không render gì */
  isVerified?: boolean;
  /** "sm" = icon đơn giản inline | "md" = icon + text nhỏ | "lg" = icon + text + outline */
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function VerifiedBadge({
  isVerified,
  size = "sm",
  className,
}: VerifiedBadgeProps) {
  if (!isVerified) return null;

  if (size === "sm") {
    return (
      <ShieldCheck
        className={cn("h-4 w-4 text-blue-600 shrink-0", className)}
        aria-label="Tài khoản đã xác minh"
      />
    );
  }

  if (size === "md") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-xs font-medium text-blue-600",
          className
        )}
        aria-label="Tài khoản đã xác minh"
      >
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
        Đã xác minh
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700",
        className
      )}
      aria-label="Tài khoản đã xác minh danh tính"
    >
      <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
      Đã xác minh danh tính
    </span>
  );
}
