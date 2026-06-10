"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, User, Phone, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { authApi } from "@/lib/api/auth.api";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "TENANT" as "TENANT" | "LANDLORD",
    agreeToTerms: false,
  });

  // Kiểm tra độ mạnh mật khẩu theo quy tắc backend
  const isLengthValid = formData.password.length >= 8;
  const hasUppercase = /[A-Z]/.test(formData.password);
  const hasNumber = /\d/.test(formData.password);
  const isPasswordValid = isLengthValid && hasUppercase && hasNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid) {
      toast.error("Mật khẩu chưa đủ mạnh. Vui lòng kiểm tra các tiêu chí!");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Mật khẩu xác nhận không trùng khớp!");
      return;
    }

    if (!formData.agreeToTerms) {
      toast.error("Bạn phải đồng ý với Điều khoản sử dụng và Chính sách bảo mật!");
      return;
    }

    setIsLoading(true);

    try {
      const data = await authApi.register({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phoneNumber: formData.phone,
        role: formData.role,
      });

      if (data.success) {
        toast.success("Đăng ký thành công! Đang chuyển đến trang xác thực OTP.");
        router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`);
      } else {
        // Xử lý lỗi trả về từ Backend (validation hoặc email đã tồn tại)
        if (data.errors) {
          const errorMsg = Object.values(data.errors).join(", ");
          toast.error(errorMsg || data.message || "Đăng ký thất bại!");
        } else {
          toast.error(data.message || "Đăng ký thất bại! Vui lòng thử lại.");
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Không thể kết nối đến máy chủ. Vui lòng thử lại sau!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md my-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="backdrop-blur-md bg-white/80 border border-white/20 shadow-2xl rounded-3xl p-8"
      >
        <h1 className="text-3xl font-extrabold text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
          Đăng ký tài khoản
        </h1>
        <p className="text-gray-500 text-center text-sm mb-8">
          Tạo tài khoản RentSpace và bắt đầu trải nghiệm ngay hôm nay
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Họ và tên */}
          <div>
            <label htmlFor="fullName" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Họ và tên
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                id="fullName"
                disabled={isLoading}
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white/50 text-gray-800 disabled:opacity-50"
                placeholder="Nguyễn Văn A"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                id="email"
                disabled={isLoading}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white/50 text-gray-800 disabled:opacity-50"
                placeholder="example@email.com"
                required
              />
            </div>
          </div>

          {/* Số điện thoại */}
          <div>
            <label htmlFor="phone" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Số điện thoại
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="tel"
                id="phone"
                disabled={isLoading}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/(?!^\+)[^\d]/g, "") })}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white/50 text-gray-800 disabled:opacity-50"
                placeholder="0901234567"
                required
              />
            </div>
          </div>

          {/* Mật khẩu */}
          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                disabled={isLoading}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

            {/* Checklist kiểm tra độ mạnh mật khẩu */}
            {formData.password.length > 0 && (
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

          {/* Xác nhận mật khẩu */}
          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Xác nhận mật khẩu
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                id="confirmPassword"
                disabled={isLoading}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white/50 text-gray-800 disabled:opacity-50"
                placeholder="••••••••"
                required
              />
            </div>
            {formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-red-500">
                <AlertCircle className="h-4 w-4" />
                <span>Mật khẩu xác nhận chưa khớp</span>
              </div>
            )}
          </div>

          {/* Lựa chọn vai trò (Role Card Selectors) */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Tôi muốn tham gia với vai trò:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setFormData({ ...formData, role: "TENANT" })}
                className={`p-4 border-2 rounded-xl text-center transition-all disabled:opacity-50 disabled:pointer-events-none ${
                  formData.role === "TENANT"
                    ? "border-blue-500 bg-blue-50/50 shadow-md shadow-blue-500/5 text-blue-600 scale-[1.02]"
                    : "border-gray-200/80 bg-white/20 text-gray-600 hover:border-gray-300"
                }`}
              >
                <div className="font-bold text-sm">Người thuê phòng</div>
                <div className="text-[10px] text-gray-500 mt-1">Tìm kiếm và thuê phòng nhanh chóng</div>
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setFormData({ ...formData, role: "LANDLORD" })}
                className={`p-4 border-2 rounded-xl text-center transition-all disabled:opacity-50 disabled:pointer-events-none ${
                  formData.role === "LANDLORD"
                    ? "border-blue-500 bg-blue-50/50 shadow-md shadow-blue-500/5 text-blue-600 scale-[1.02]"
                    : "border-gray-200/80 bg-white/20 text-gray-600 hover:border-gray-300"
                }`}
              >
                <div className="font-bold text-sm">Chủ cho thuê</div>
                <div className="text-[10px] text-gray-500 mt-1">Đăng tin và quản lý phòng trống</div>
              </button>
            </div>
          </div>

          {/* Đồng ý điều khoản */}
          <div className="pt-2">
            <label className="flex items-start cursor-pointer select-none">
              <input
                type="checkbox"
                disabled={isLoading}
                checked={formData.agreeToTerms}
                onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-offset-0 transition-colors cursor-pointer"
              />
              <span className="ml-2 text-xs text-gray-500 leading-normal">
                Tôi đồng ý với{" "}
                <Link href="/terms" target="_blank" className="text-blue-600 font-semibold hover:underline">
                  Điều khoản dịch vụ
                </Link>{" "}
                và{" "}
                <Link href="/privacy" target="_blank" className="text-blue-600 font-semibold hover:underline">
                  Chính sách bảo mật
                </Link>{" "}
                của RentSpace.
              </span>
            </label>
          </div>

          {/* Nút bấm Đăng ký */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Đang xử lý đăng ký...</span>
              </>
            ) : (
              <span>Đăng ký ngay</span>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-gray-500">
          Đã có tài khoản?{" "}
          <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-bold transition-colors">
            Đăng nhập ngay
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
