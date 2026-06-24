"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bell, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useWebPush } from "@/hooks/useWebPush";

const DISMISSED_KEY = "rentspace_webpush_dismissed";
const SHOW_DELAY_MS = 20_000;

export function WebPushBanner() {
  const { status } = useSession();
  const { permission, isSubscribing, subscribeToPush } = useWebPush();
  const [visible, setVisible] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (status !== "authenticated") return;
    if (permission !== "default") return;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [status, permission]);

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, "1");
  };

  const handleSubscribe = async () => {
    await subscribeToPush();
    setVisible(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(DISMISSED_KEY, "1");
    }
  };

  if (permission === "unsupported" || permission !== "default") return null;
  if (status !== "authenticated") return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={
            shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }
          }
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm"
          role="dialog"
          aria-label="Bật thông báo đẩy"
        >
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
            <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Bell className="h-4 w-4 text-blue-600" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 leading-tight">
                Bật thông báo
              </p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Nhận ngay khi có yêu cầu cọc, tin nhắn mới hoặc cập nhật hợp đồng.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleSubscribe}
                  disabled={isSubscribing}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 active:scale-[0.98] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubscribing ? "Đang bật..." : "Bật thông báo"}
                </button>
                <button
                  onClick={handleDismiss}
                  className="py-1.5 px-3 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors"
                >
                  Để sau
                </button>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="flex-shrink-0 -mt-0.5 -mr-0.5 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Đóng"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
