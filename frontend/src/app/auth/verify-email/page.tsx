"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, ArrowLeft, RefreshCw, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { authApi } from "@/lib/api/auth.api";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60); // Đếm ngược 60s
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Tự động focus vào ô đầu tiên khi trang tải
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Đếm ngược gửi lại mã OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    // Chỉ cho phép nhập số
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    // Lấy ký tự cuối cùng vừa nhập nếu gõ đè
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Tự động chuyển sang ô tiếp theo nếu đã nhập giá trị
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Nhấn Backspace để quay lại ô trước đó
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim().slice(0, 6);

    // Chỉ dán nếu chuỗi là các chữ số
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    // Focus vào ô tiếp theo tương ứng hoặc ô cuối cùng
    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      toast.error("Vui lòng nhập đầy đủ mã OTP 6 chữ số!");
      return;
    }

    if (!email) {
      toast.error("Thiếu thông tin email để xác thực. Vui lòng quay lại trang đăng ký!");
      return;
    }

    setIsVerifying(true);

    try {
      const data = await authApi.verifyOtp({
        email: email,
        otp: otpCode,
      });

      if (data.success) {
        toast.success("Xác thực tài khoản thành công! Đang chuyển đến trang đăng nhập...");
        setTimeout(() => {
          router.push("/auth/login");
        }, 1500);
      } else {
        toast.error(data.message || "Mã OTP không đúng hoặc đã hết hạn!");
      }
    } catch (error) {
      console.error("Verify OTP error:", error);
      toast.error("Không thể kết nối đến máy chủ. Vui lòng thử lại sau!");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;

    if (!email) {
      toast.error("Không tìm thấy địa chỉ email!");
      return;
    }

    setIsResending(true);

    try {
      const data = await authApi.resendOtp({
        email: email,
      });

      if (data.success) {
        toast.success("Mã OTP mới đã được gửi thành công!");
        setCountdown(60); // Reset bộ đếm ngược về 60s
      } else {
        toast.error(data.message || "Không thể gửi lại mã OTP. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại sau!");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full max-w-md px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="backdrop-blur-md bg-white/80 border border-white/20 shadow-2xl rounded-3xl p-8"
      >
        <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Mail className="h-8 w-8 text-blue-600 animate-pulse" />
        </div>

        <h1 className="text-3xl font-extrabold text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
          Xác minh Email
        </h1>
        <p className="text-gray-500 text-center text-sm mb-3">
          Mã xác thực OTP đã được gửi đến email của bạn:
        </p>
        <p className="text-gray-800 text-center font-semibold text-sm mb-8 break-all">
          {email || "your-email@example.com"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Lưới nhập mã OTP */}
          <div className="flex gap-2.5 justify-center">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                disabled={isVerifying}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-12 h-14 text-center text-xl font-bold border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none bg-white/50 text-gray-800 transition-all disabled:opacity-50"
              />
            ))}
          </div>

          {/* Nút bấm Xác minh */}
          <button
            type="submit"
            disabled={isVerifying}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Đang kiểm tra mã...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                <span>Xác minh tài khoản</span>
              </>
            )}
          </button>
        </form>

        {/* Luồng gửi lại mã */}
        <div className="mt-8 text-center border-t border-gray-100 pt-6">
          <p className="text-xs text-gray-500 mb-3">Bạn không nhận được mã OTP?</p>
          <button
            type="button"
            onClick={handleResend}
            disabled={countdown > 0 || isResending}
            className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 disabled:text-gray-400 transition-colors disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${isResending ? "animate-spin" : ""}`} />
            {countdown > 0 ? (
              <span>Gửi lại mã sau {countdown} giây</span>
            ) : (
              <span>Gửi lại mã OTP ngay</span>
            )}
          </button>
        </div>

        {/* Nút quay lại đăng nhập */}
        <div className="mt-6 text-center">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Quay lại trang đăng nhập</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md bg-white/80 border border-white/20 shadow-2xl rounded-3xl p-8 flex flex-col items-center justify-center min-h-[300px]">
          <svg className="animate-spin h-8 w-8 text-blue-600 mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm text-gray-500 font-semibold">Đang chuẩn bị trang xác thực...</span>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
