"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useSessionId } from "./useSessionId";

// Endpoint public — không cần JWT, dùng trực tiếp fetch thay vì axios
// để tránh axios interceptor async bị browser cancel khi page unload
const TRACK_URL = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1"}/interactions/track`;

/**
 * Hook tự động track sự kiện VIEW khi user ở trên trang listing.
 * Chỉ ghi nhận VIEW nếu user ở lại ít nhất 3 giây (lọc bounce).
 * Ghi kèm viewDurationSec khi user rời trang.
 *
 * @param listingId ID của listing đang xem
 * @param referrer  Nguồn truy cập: "SEARCH" | "RECOMMENDATION" | "DIRECT" | "SEO"
 */
export function useInteractionTracker(
  listingId: number,
  referrer: string = "DIRECT"
) {
  const { data: authSession } = useSession();
  const sessionId = useSessionId();
  const hasStayedRef = useRef(false);
  const hasTrackedRef = useRef(false);
  const startTimeRef = useRef(0);
  const accessTokenRef = useRef<string | undefined>(undefined);
  // Sync token sau mỗi render mà không thêm authSession vào deps của effect tracking
  useEffect(() => {
    accessTokenRef.current = (authSession as { accessToken?: string } | null)?.accessToken;
  });

  useEffect(() => {
    // Reset trạng thái khi listingId thay đổi
    hasStayedRef.current = false;
    hasTrackedRef.current = false;
    startTimeRef.current = Date.now();

    // Sau 3 giây, đánh dấu user không bounce
    const stayTimer = setTimeout(() => {
      hasStayedRef.current = true;
    }, 3000);

    const doTrack = () => {
      if (!hasStayedRef.current || hasTrackedRef.current) return;
      hasTrackedRef.current = true;

      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (accessTokenRef.current) headers["Authorization"] = `Bearer ${accessTokenRef.current}`;

      // keepalive: true đảm bảo request hoàn thành kể cả khi component unmount
      // (axios bị cancel bởi browser khi page unload, fetch với keepalive thì không)
      fetch(TRACK_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          listingId,
          type: "VIEW",
          viewDurationSec: duration,
          referrer,
          sessionId,
        }),
        keepalive: true,
      }).catch(() => {
        // Fire-and-forget: bỏ qua lỗi network, không block UX
      });
    };

    // Track khi user chuyển tab hoặc minimize browser
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") doTrack();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearTimeout(stayTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      // Track khi component unmount (Next.js SPA navigation)
      doTrack();
    };
  }, [listingId, sessionId, referrer]);
}
