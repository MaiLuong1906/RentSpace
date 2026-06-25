"use client";

import { useState } from "react";
import { ShieldAlert, X, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const DISMISSED_KEY = "verification_banner_dismissed";

interface VerificationBannerProps {
  /** Chỉ hiển thị khi isVerified = false và user đã đăng nhập */
  isVerified?: boolean;
  /** "unstarted" = chưa nộp, "processing" = đang xét duyệt */
  verificationStatus?: string;
}

export function VerificationBanner({
  isVerified,
  verificationStatus,
}: VerificationBannerProps) {
  const prefersReduced = useReducedMotion();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem(DISMISSED_KEY);
  });

  const visible = !isVerified && !dismissed;

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  };

  const isProcessing = verificationStatus === "PROCESSING";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReduced ? undefined : { opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="w-full border-b border-amber-200 bg-amber-50 px-4 py-3"
          role="alert"
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-sm text-amber-800">
                {isProcessing ? (
                  <>
                    Hồ sơ xác minh danh tính đang được xét duyệt.{" "}
                    <span className="text-amber-600">
                      Chúng tôi sẽ thông báo trong 1-3 ngày làm việc.
                    </span>
                  </>
                ) : (
                  <>
                    Xác minh danh tính để tăng độ tin cậy với người thuê.{" "}
                    <Link
                      href="/app/profile/verify"
                      className="font-medium text-amber-700 underline underline-offset-2 hover:text-amber-900"
                    >
                      Xác minh ngay
                      <ArrowRight className="ml-0.5 inline h-3 w-3" />
                    </Link>
                  </>
                )}
              </p>
            </div>
            <button
              onClick={dismiss}
              className="shrink-0 rounded p-1 text-amber-600 hover:bg-amber-100"
              aria-label="Đóng thông báo"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
