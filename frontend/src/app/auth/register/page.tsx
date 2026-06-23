"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  Home,
  Shield,
  Star,
  Users,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { authApi } from "@/lib/api/auth.api";

const TRUST_ITEMS = [
  { icon: <Shield className="h-4 w-4 text-blue-600" />, text: "KYC xác thực danh tính" },
  { icon: <Star className="h-4 w-4 text-blue-600" />, text: "Review chân thực từ người thuê thật" },
  { icon: <Users className="h-4 w-4 text-blue-600" />, text: "10.000+ người dùng tin tưởng" },
];

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
        if (data.errors) {
          toast.error(Object.values(data.errors).join(", ") || data.message || "Đăng ký thất bại!");
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

  const inputClass =
    "w-full py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all disabled:opacity-50 disabled:bg-gray-50";

  return (
    <div className="w-full max-w-4xl my-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 bg-white rounded-2xl border border-gray-200 shadow-[0_8px_32px_rgba(0,0,0,0.06)] overflow-hidden">
        {/* ── Left panel — brand ── */}
        <div className="hidden lg:flex flex-col justify-between bg-blue-600 p-10 text-white">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Home className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">RentSpace</span>
          </Link>

          <div>
            <h2 className="text-3xl font-bold tracking-tight leading-tight mb-4">
              Bắt đầu hành trình<br />
              tìm phòng tốt hơn
            </h2>
            <p className="text-blue-100 text-sm leading-relaxed mb-8">
              Tạo tài khoản miễn phí và trải nghiệm nền tảng thuê phòng an toàn, minh bạch nhất tại Việt Nam.
            </p>

            <ul className="space-y-3">
              {TRUST_ITEMS.map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-white/15 rounded-lg flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <span className="text-sm text-blue-50">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-blue-200">
            © 2026 RentSpace. Bảo lưu mọi quyền.
          </p>
        </div>

        {/* ── Right panel — form ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="p-8 md:p-10 overflow-y-auto"
        >
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 mb-6 lg:hidden">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <Home className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-gray-900 tracking-tight">RentSpace</span>
          </Link>

          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-1">
              Đăng ký tài khoản
            </h1>
            <p className="text-sm text-gray-500">
              Tạo tài khoản RentSpace và bắt đầu trải nghiệm ngay hôm nay
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Họ và tên */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1.5">
                Họ và tên
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  id="fullName"
                  disabled={isLoading}
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className={`${inputClass} pl-9 pr-4`}
                  placeholder="Nguyễn Văn A"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  disabled={isLoading}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`${inputClass} pl-9 pr-4`}
                  placeholder="example@email.com"
                  required
                />
              </div>
            </div>

            {/* Số điện thoại */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                Số điện thoại
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  id="phone"
                  disabled={isLoading}
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      phone: e.target.value.replace(/(?!^\+)[^\d]/g, ""),
                    })
                  }
                  className={`${inputClass} pl-9 pr-4`}
                  placeholder="0901234567"
                  required
                />
              </div>
            </div>

            {/* Mật khẩu */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  disabled={isLoading}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`${inputClass} pl-9 pr-10`}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {formData.password.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-2 p-3 bg-gray-50 border border-gray-100 rounded-lg space-y-1.5"
                >
                  {[
                    { ok: isLengthValid, label: "Tối thiểu 8 ký tự" },
                    { ok: hasUppercase, label: "Chứa ít nhất 1 chữ viết hoa" },
                    { ok: hasNumber, label: "Chứa ít nhất 1 chữ số" },
                  ].map((c) => (
                    <div key={c.label} className="flex items-center gap-2 text-xs">
                      <CheckCircle2
                        className={`h-3.5 w-3.5 ${c.ok ? "text-emerald-500" : "text-gray-300"}`}
                      />
                      <span className={c.ok ? "text-emerald-700 font-medium" : "text-gray-500"}>
                        {c.label}
                      </span>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Xác nhận mật khẩu */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="confirmPassword"
                  disabled={isLoading}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  className={`${inputClass} pl-9 pr-4`}
                  placeholder="••••••••"
                  required
                />
              </div>
              {formData.confirmPassword.length > 0 &&
                formData.password !== formData.confirmPassword && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-red-500">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Mật khẩu xác nhận chưa khớp</span>
                  </div>
                )}
            </div>

            {/* Vai trò */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tôi muốn tham gia với vai trò
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    { val: "TENANT", label: "Người thuê phòng", desc: "Tìm kiếm và thuê phòng" },
                    { val: "LANDLORD", label: "Chủ cho thuê", desc: "Đăng tin và quản lý phòng" },
                  ] as const
                ).map((r) => (
                  <button
                    key={r.val}
                    type="button"
                    disabled={isLoading}
                    onClick={() => setFormData({ ...formData, role: r.val })}
                    className={`p-3.5 border-2 rounded-xl text-left transition-all ${
                      formData.role === r.val
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-semibold text-sm">{r.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Điều khoản */}
            <div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={isLoading}
                  checked={formData.agreeToTerms}
                  onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                  className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-xs text-gray-500 leading-relaxed">
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

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Đăng ký ngay"
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            Đã có tài khoản?{" "}
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
              Đăng nhập ngay
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
