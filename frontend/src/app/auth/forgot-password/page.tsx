"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, KeyRound, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Nhập email, Step 2: Nhập OTP & Mật khẩu mới
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Đếm ngược gửi lại mã OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Focus ô OTP đầu tiên khi chuyển sang bước 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 300);
    }
  }, [step]);

  // Kiểm tra độ mạnh mật khẩu
  const isLengthValid = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const isPasswordValid = isLengthValid && hasUppercase && hasNumber;

  // Luồng xử lý ô OTP
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim().slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    const focusIndex = Math.min(pastedData.length, 5);
    otpInputRefs.current[focusIndex]?.focus();
  };

  // Bước 1: Yêu cầu gửi OTP khôi phục mật khẩu
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Vui lòng điền địa chỉ email!");
      return;
    }

    setIsLoading(true);

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
      const response = await fetch(`${apiBaseUrl}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Mã OTP khôi phục mật khẩu đã được gửi đến email của bạn!");
        setStep(2);
        setCountdown(60); // Đếm ngược 60s cho lần gửi lại tiếp theo
      } else {
        toast.error(data.message || "Không thể yêu cầu khôi phục mật khẩu. Vui lòng thử lại!");
      }
    } catch (error) {
      console.error("Forgot password request error:", error);
      toast.error("Không thể kết nối đến máy chủ. Vui lòng thử lại sau!");
    } finally {
      setIsLoading(false);
    }
  };

  // Gửi lại mã OTP từ Bước 2
  const handleResendOtp = async () => {
    if (countdown > 0 || isResending) return;
    setIsResending(true);

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
      const response = await fetch(`${apiBaseUrl}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Mã OTP mới đã được gửi thành công!");
        setCountdown(60);
      } else {
        toast.error(data.message || "Không thể gửi lại mã OTP.");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại sau!");
    } finally {
      setIsResending(false);
    }
  };

  // Bước 2: Đặt lại mật khẩu mới
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      toast.error("Vui lòng nhập đầy đủ mã OTP 6 chữ số!");
      return;
    }

    if (!isPasswordValid) {
      toast.error("Mật khẩu chưa đủ mạnh. Vui lòng kiểm tra các tiêu chí!");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không trùng khớp!");
      return;
    }

    setIsLoading(true);

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
      const response = await fetch(`${apiBaseUrl}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          otp: otpCode,
          newPassword: password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Đặt lại mật khẩu thành công! Đang quay lại trang đăng nhập...");
        setTimeout(() => {
          router.push("/auth/login");
        }, 1500);
      } else {
        toast.error(data.message || "Mã OTP không đúng hoặc mật khẩu không hợp lệ!");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại sau!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md px-4 my-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="backdrop-blur-md bg-white/80 border border-white/20 shadow-2xl rounded-3xl p-8 overflow-hidden relative"
      >
        <AnimatePresence mode="wait">
          {step === 1 ? (
            /* ================= BƯỚC 1: NHẬP EMAIL ================= */
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-3xl font-extrabold text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Quên mật khẩu?
              </h1>
              <p className="text-gray-500 text-center text-sm mb-8">
                Nhập email tài khoản của bạn để nhận mã OTP khôi phục mật khẩu.
              </p>

              <form onSubmit={handleRequestOtp} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    Email đăng ký
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      disabled={isLoading}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white/50 text-gray-800 disabled:opacity-50"
                      placeholder="example@email.com"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Đang gửi mã...</span>
                    </>
                  ) : (
                    <span>Gửi mã xác thực OTP</span>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 font-semibold transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Quay lại trang đăng nhập</span>
                </Link>
              </div>
            </motion.div>
          ) : (
            /* ================= BƯỚC 2: NHẬP OTP & ĐỔI MẬT KHẨU ================= */
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <KeyRound className="h-7 w-7 text-blue-600 animate-bounce" />
              </div>

              <h1 className="text-2xl font-extrabold text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Đặt lại mật khẩu
              </h1>
              <p className="text-gray-500 text-center text-xs mb-1">
                Mã xác minh OTP đã được gửi đến email:
              </p>
              <p className="text-gray-800 text-center font-bold text-xs mb-6 break-all">
                {email}
              </p>

              <form onSubmit={handleResetPassword} className="space-y-5">
                {/* Nhập OTP */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 text-center">
                    Nhập mã OTP 6 chữ số
                  </label>
                  <div className="flex gap-2 justify-center">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          otpInputRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        disabled={isLoading}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={handleOtpPaste}
                        className="w-10 h-12 text-center text-lg font-bold border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none bg-white/50 text-gray-800 transition-all disabled:opacity-50"
                      />
                    ))}
                  </div>
                </div>

                {/* Mật khẩu mới */}
                <div>
                  <label htmlFor="newPassword" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="newPassword"
                      disabled={isLoading}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white/50 text-gray-800 disabled:opacity-50"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>

                  {/* Checklist mật khẩu */}
                  {password.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-3 p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-1.5 text-xs text-gray-500"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className={`h-4 w-4 transition-colors ${isLengthValid ? "text-green-500" : "text-gray-300"}`} />
                        <span className={isLengthValid ? "text-green-700 font-medium" : ""}>Tối thiểu 8 ký tự</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className={`h-4 w-4 transition-colors ${hasUppercase ? "text-green-500" : "text-gray-300"}`} />
                        <span className={hasUppercase ? "text-green-700 font-medium" : ""}>Chứa ít nhất 1 chữ viết hoa</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className={`h-4 w-4 transition-colors ${hasNumber ? "text-green-500" : "text-gray-300"}`} />
                        <span className={hasNumber ? "text-green-700 font-medium" : ""}>Chứa ít nhất 1 chữ số</span>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Xác nhận mật khẩu mới */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    Xác nhận mật khẩu mới
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="confirmPassword"
                      disabled={isLoading}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white/50 text-gray-800 disabled:opacity-50"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  {confirmPassword.length > 0 && password !== confirmPassword && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-red-500">
                      <AlertCircle className="h-4 w-4" />
                      <span>Mật khẩu xác nhận chưa khớp</span>
                    </div>
                  )}
                </div>

                {/* Nút bấm Xác nhận */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Đang cập nhật mật khẩu...</span>
                    </>
                  ) : (
                    <span>Xác nhận đổi mật khẩu</span>
                  )}
                </button>
              </form>

              {/* Gửi lại OTP đếm ngược */}
              <div className="mt-6 text-center border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={countdown > 0 || isResending}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 disabled:text-gray-400 transition-colors disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isResending ? "animate-spin" : ""}`} />
                  {countdown > 0 ? (
                    <span>Gửi lại mã sau {countdown}s</span>
                  ) : (
                    <span>Gửi lại mã OTP khôi phục</span>
                  )}
                </button>
              </div>

              {/* Quay lại Bước 1 */}
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 font-semibold transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Quay lại nhập Email</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
