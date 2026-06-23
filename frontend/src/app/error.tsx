"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home, ChevronRight } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-gray-200 animate-in fade-in duration-300">

        {/* Animated Icon & Error Text */}
        <div className="flex justify-center">
          <div className="p-4 bg-red-50 rounded-full text-red-500">
            <AlertTriangle className="h-12 w-12 animate-bounce" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-gray-900">
            Hệ thống gặp sự cố
          </h1>
          <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
            Đã có lỗi kỹ thuật không mong muốn xảy ra. Đội ngũ kỹ thuật của chúng tôi đã được thông báo để khắc phục.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 active:scale-98 transition-all shadow-md shadow-blue-500/10"
          >
            <RotateCcw className="h-4 w-4" />
            Thử tải lại trang
          </button>

          <Link
            href="/app"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 font-semibold text-sm active:scale-98 transition-all"
          >
            <Home className="h-4 w-4" />
            Trang chủ
          </Link>
        </div>

        {/* Developer Info Accordion (Collapsible) */}
        {process.env.NODE_ENV === "development" && (
          <details className="text-left bg-gray-50 p-4 rounded-xl border border-gray-200">
            <summary className="text-xs font-semibold text-gray-600 cursor-pointer select-none flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 details-open:rotate-90" />
              Chi tiết lỗi (Chỉ hiển thị khi Dev)
            </summary>
            <div className="mt-3 text-[11px] font-mono text-red-600 overflow-x-auto space-y-1 leading-relaxed max-h-40">
              <p className="font-bold">Message: {error.message || "Unknown error"}</p>
              {error.digest && <p className="text-gray-500">Digest ID: {error.digest}</p>}
              {error.stack && (
                <pre className="whitespace-pre overflow-x-auto mt-2 text-gray-600 border-t border-gray-200 pt-2">
                  {error.stack}
                </pre>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
