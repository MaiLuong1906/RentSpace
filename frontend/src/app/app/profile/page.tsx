"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { User, Mail, Phone, Calendar, ShieldCheck, ShieldAlert, ShieldEllipsis, ShieldX, KeyRound, Bell, Edit2, Camera, Lock, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { userApi } from "@/lib/api/user.api";
import { authApi } from "@/lib/api/auth.api";
import { kycApi } from "@/lib/api/kyc.api";

interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string | null;
  role: "TENANT" | "LANDLORD" | "ADMIN";
  kycStatus: "PENDING" | "SUBMITTED" | "VERIFIED" | "REJECTED";
  cccdImageUrl?: string | null;
  isEmailVerified: boolean;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "notifications">("profile");

  // State chỉnh sửa hồ sơ
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State upload avatar
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước ảnh không được vượt quá 5MB!");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Chỉ chấp nhận file ảnh (PNG, JPG, WEBP)!");
      return;
    }

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await userApi.updateAvatar(formData);

      if (result.success && result.data) {
        toast.success("Cập nhật ảnh đại diện thành công!");
        setProfile(prev => prev ? { ...prev, ...result.data } : result.data as UserProfile);
      } else {
        toast.error(result.message || "Không thể tải lên ảnh đại diện!");
      }
    } catch (error) {
      console.error("Upload avatar error:", error);
      toast.error("Lỗi kết nối khi tải lên ảnh đại diện!");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // State đổi mật khẩu chủ động
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSecurityFormOpen, setIsSecurityFormOpen] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!oldPassword) {
      toast.error("Vui lòng nhập mật khẩu hiện tại!");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Mật khẩu mới phải có ít nhất 8 ký tự!");
      return;
    }

    if (newPassword === oldPassword) {
      toast.error("Mật khẩu mới không được trùng với mật khẩu hiện tại!");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Xác nhận mật khẩu mới không trùng khớp!");
      return;
    }

    setIsChangingPassword(true);

    try {
      const result = await authApi.changePassword({ oldPassword, newPassword });

      if (result.success) {
        toast.success("Thay đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setIsSecurityFormOpen(false);

        setTimeout(() => {
          signOut({ callbackUrl: "/auth/login" });
        }, 1500);
      } else {
        toast.error(result.message || "Không thể thay đổi mật khẩu!");
      }
    } catch (error) {
      console.error("Change password error:", error);
      toast.error("Lỗi kết nối khi thay đổi mật khẩu!");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Fetch dữ liệu profile trực tiếp từ Backend sử dụng accessToken của Session
  const profileFetchedRef = useRef(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (status === "loading") return;

      if (status === "unauthenticated" || !session?.accessToken) {
        setLoading(false);
        return;
      }

      if (profileFetchedRef.current) return;
      profileFetchedRef.current = true;

      try {
        const result = await userApi.getMyProfile();

        if (result.success && result.data) {
          let kycStatus = result.data.kycStatus;
          let cccdImageUrl = null;

          try {
            const kycResult = await kycApi.getKycStatus();
            if (kycResult.success && kycResult.data) {
              kycStatus = kycResult.data.status;
              cccdImageUrl = kycResult.data.cccdImageUrl;
            }
          } catch (err) {
            console.error("Fetch KYC status error in profile page:", err);
          }

          setProfile({
            ...result.data,
            kycStatus,
            cccdImageUrl,
          });
          setFullName(result.data.fullName);
          setPhoneNumber(result.data.phoneNumber || "");
        } else {
          toast.error(result.message || "Không thể tải thông tin hồ sơ!");
        }
      } catch (error) {
        console.error("Fetch profile error:", error);
        toast.error("Lỗi kết nối đến máy chủ khi tải hồ sơ!");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [session, status]);

  // Định dạng hiển thị ngày tham gia
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Hủy bỏ chỉnh sửa hồ sơ (Khôi phục thông tin cũ)
  const handleCancelEdit = () => {
    if (profile) {
      setFullName(profile.fullName);
      setPhoneNumber(profile.phoneNumber || "");
    }
    setIsEditing(false);
  };

  // Gửi yêu cầu cập nhật hồ sơ đến API PUT /api/v1/users/me
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || fullName.length < 2 || fullName.length > 100) {
      toast.error("Họ tên phải từ 2 đến 100 ký tự!");
      return;
    }

    const phoneRegex = /^(\+84|0)[3-9]\d{8}$/;
    if (phoneNumber && !phoneRegex.test(phoneNumber)) {
      toast.error("Số điện thoại không hợp lệ! (Ví dụ: 0987654321 hoặc +84987654321)");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await userApi.updateProfile({ fullName, phoneNumber });

      if (result.success && result.data) {
        toast.success("Cập nhật thông tin cá nhân thành công!");
        setProfile(prev => prev ? { ...prev, ...result.data } : result.data as UserProfile);
        setIsEditing(false);
      } else {
        toast.error(result.message || "Không thể cập nhật thông tin!");
      }
    } catch (error) {
      console.error("Update profile error:", error);
      toast.error("Lỗi kết nối khi cập nhật hồ sơ!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trả về Badge tương ứng với trạng thái KYC của người dùng
  const renderKycBadge = (status: UserProfile["kycStatus"]) => {
    switch (status) {
      case "VERIFIED":
        return (
          <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-xs font-bold shadow-sm shadow-emerald-500/5">
            <ShieldCheck className="h-4 w-4 text-emerald-600 animate-pulse" />
            <span>Đã xác thực danh tính (KYC)</span>
          </div>
        );
      case "PENDING":
        if (profile?.cccdImageUrl) {
          return (
            <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 border border-blue-100 text-blue-700 rounded-2xl text-xs font-bold shadow-sm shadow-blue-500/5 animate-pulse">
              <ShieldEllipsis className="h-4 w-4 text-blue-600" />
              <span>Hồ sơ KYC đang chờ duyệt</span>
            </div>
          );
        }
      // Nếu kycStatus là PENDING nhưng chưa có ảnh CCCD (mặc định đăng ký mới) -> Xem như chưa nộp
      // Sẽ rơi xuống block default tiếp theo
      case "REJECTED":
        if (status === "REJECTED") {
          return (
            <div className="flex flex-col items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-xs font-bold shadow-sm shadow-rose-500/5">
                <ShieldX className="h-4 w-4 text-rose-600" />
                <span>Yêu cầu KYC bị từ chối</span>
              </div>
              <Link
                href="/app/kyc"
                className="text-xs text-blue-600 hover:underline font-bold transition-all"
              >
                Gửi lại yêu cầu xác thực →
              </Link>
            </div>
          );
        }
      default:
        return (
          <div className="flex flex-col items-center gap-3">
            <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-50 border border-amber-100 text-amber-700 rounded-2xl text-xs font-bold shadow-sm shadow-amber-500/5">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              <span>Chưa xác thực danh tính (KYC)</span>
            </div>
            <Link
              href="/app/kyc"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 hover:shadow-lg active:scale-95 transition-all text-center"
            >
              Xác thực tài khoản ngay
            </Link>
          </div>
        );
    }
  };

  // ===== TRẠNG THÁI LOADING (SKELETON LOADER) =====
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 py-10 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header Skeleton */}
          <div className="h-10 w-48 bg-gray-200 animate-pulse rounded-xl" />

          <div className="grid md:grid-cols-3 gap-8">
            {/* Left Card Skeleton */}
            <div className="bg-white border border-gray-100 shadow-xl shadow-gray-200/20 rounded-3xl p-8 flex flex-col items-center space-y-6">
              <div className="w-32 h-32 rounded-full bg-gray-200 animate-pulse" />
              <div className="h-6 w-36 bg-gray-200 animate-pulse rounded-lg" />
              <div className="h-4 w-20 bg-gray-200 animate-pulse rounded-lg" />
              <div className="h-10 w-full bg-gray-200 animate-pulse rounded-xl" />
            </div>

            {/* Right Card Skeleton */}
            <div className="md:col-span-2 bg-white border border-gray-100 shadow-xl shadow-gray-200/20 rounded-3xl p-8 space-y-8">
              <div className="flex gap-4 border-b border-gray-100 pb-4">
                <div className="h-8 w-24 bg-gray-200 animate-pulse rounded-lg" />
                <div className="h-8 w-24 bg-gray-200 animate-pulse rounded-lg" />
              </div>
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 animate-pulse rounded-md" />
                    <div className="h-12 w-full bg-gray-200 animate-pulse rounded-xl" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== TRẠNG THÁI CHƯA ĐĂNG NHẬP =====
  if (status === "unauthenticated" || !session) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md bg-white border border-gray-100 shadow-2xl rounded-3xl p-8 text-center"
        >
          <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="h-8 w-8 text-red-600 animate-bounce" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Truy cập bị từ chối</h2>
          <p className="text-gray-500 text-sm mb-8">
            Bạn cần đăng nhập tài khoản để có thể xem và quản lý thông tin hồ sơ cá nhân.
          </p>
          <button
            onClick={() => router.push("/auth/login")}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all active:scale-[0.98]"
          >
            Đăng nhập ngay
          </button>
        </motion.div>
      </div>
    );
  }

  // ===== GIAO DIỆN HIỂN THỊ THẬT SỰ =====
  return (
    <div className="min-h-screen bg-gray-50/50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-8"
        >
          Hồ sơ của tôi
        </motion.h1>

        <div className="grid md:grid-cols-3 gap-8">
          {/* ================= THẺ AVATAR & VAI TRÒ (LEFT CARD) ================= */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white border border-gray-100 shadow-xl shadow-gray-200/10 rounded-3xl p-8 flex flex-col items-center text-center"
          >
            {/* Vòng tròn Avatar với hover trigger */}
            <div className="relative group mb-6">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-50/50 shadow-inner bg-gray-100 flex items-center justify-center relative">
                {profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.fullName}
                    className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 ${uploadingAvatar ? "blur-[2px]" : ""}`}
                  />
                ) : (
                  <User className="h-16 w-16 text-gray-300" />
                )}

                {/* Hiệu ứng loading quay vòng khi đang upload */}
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                    <div className="h-8 w-8 border-3 border-white border-t-transparent animate-spin rounded-full" />
                  </div>
                )}
              </div>
              <button
                onClick={handleAvatarClick}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-full shadow-lg border border-white transition-all scale-95 group-hover:scale-105 active:scale-95 flex items-center justify-center"
                title="Thay đổi ảnh đại diện"
              >
                <Camera className="h-4 w-4" />
              </button>

              {/* Ô input chọn file ẩn */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Thông tin Cơ bản */}
            <h2 className="text-xl font-extrabold text-gray-800 mb-1">{profile?.fullName}</h2>
            <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full mb-6 uppercase tracking-wider ${profile?.role === "LANDLORD"
                ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                : profile?.role === "ADMIN"
                  ? "bg-red-50 text-red-700 border border-red-100"
                  : "bg-blue-50 text-blue-700 border border-blue-100"
              }`}>
              {profile?.role === "LANDLORD" ? "Chủ cho thuê" : profile?.role === "ADMIN" ? "Quản trị viên" : "Người thuê phòng"}
            </span>

            {/* Trạng thái xác thực danh tính KYC */}
            <div className="w-full pt-6 border-t border-gray-100 flex justify-center">
              {profile && renderKycBadge(profile.kycStatus)}
            </div>
          </motion.div>

          {/* ================= BẢNG CHI TIẾT TÀI KHOẢN (RIGHT CARD) ================= */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="md:col-span-2 bg-white border border-gray-100 shadow-xl shadow-gray-200/10 rounded-3xl p-8"
          >
            {/* Header Tabs */}
            <div
              className="flex md:grid md:grid-cols-3 w-full border-b border-gray-100 pb-4 mb-8 overflow-x-auto md:overflow-visible gap-2 no-scrollbar"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              <style>{`
                .no-scrollbar::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap ${activeTab === "profile"
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-500 hover:bg-gray-50"
                  }`}
              >
                <User className="h-4 w-4" />
                <span>Thông tin cá nhân</span>
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap ${activeTab === "security"
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-500 hover:bg-gray-50"
                  }`}
              >
                <KeyRound className="h-4 w-4" />
                <span>Bảo mật & Mật khẩu</span>
              </button>
              <button
                onClick={() => setActiveTab("notifications")}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap ${activeTab === "notifications"
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-500 hover:bg-gray-50"
                  }`}
              >
                <Bell className="h-4 w-4" />
                <span>Cài đặt thông báo</span>
              </button>
            </div>

            {/* Content Tabs */}
            <AnimatePresence mode="wait">
              {activeTab === "profile" && (
                /* TAB 1: HIỂN THỊ / CẬP NHẬT THÔNG TIN CHI TIẾT */
                <motion.div
                  key="profile-tab"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {!isEditing ? (
                    /* CHẾ ĐỘ HIỂN THỊ HỒ SƠ */
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-800">Chi tiết hồ sơ</h3>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 px-3.5 py-2 rounded-xl border border-blue-100 transition-all active:scale-95"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          <span>Chỉnh sửa hồ sơ</span>
                        </button>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-6">
                        {/* Họ và tên */}
                        <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl">
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Họ và tên</label>
                          <div className="flex items-center gap-2.5 text-gray-700 font-semibold text-sm">
                            <User className="h-4.5 w-4.5 text-gray-400" />
                            <span>{profile?.fullName}</span>
                          </div>
                        </div>

                        {/* Email */}
                        <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl">
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Email đăng nhập</label>
                          <div className="flex items-center gap-2.5 text-gray-700 font-semibold text-sm break-all">
                            <Mail className="h-4.5 w-4.5 text-gray-400" />
                            <span>{profile?.email}</span>
                          </div>
                        </div>

                        {/* Số điện thoại */}
                        <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl">
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Số điện thoại</label>
                          <div className="flex items-center gap-2.5 text-gray-700 font-semibold text-sm">
                            <Phone className="h-4.5 w-4.5 text-gray-400" />
                            <span>{profile?.phoneNumber || "Chưa thiết lập"}</span>
                          </div>
                        </div>

                        {/* Ngày tham gia */}
                        <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl">
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Thành viên từ ngày</label>
                          <div className="flex items-center gap-2.5 text-gray-700 font-semibold text-sm">
                            <Calendar className="h-4.5 w-4.5 text-gray-400" />
                            <span>{formatDate(profile?.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* CHẾ ĐỘ CHỈNH SỬA HỒ SƠ */
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-800">Chỉnh sửa thông tin</h3>
                        <span className="text-xs font-medium text-gray-400">Đang chỉnh sửa...</span>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-6">
                        {/* Nhập Họ và tên */}
                        <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl">
                          <label htmlFor="editFullName" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                            Họ và tên
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                            <input
                              type="text"
                              id="editFullName"
                              disabled={isSubmitting}
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white/50 text-gray-700 font-semibold text-sm disabled:opacity-50"
                              placeholder="Họ và tên đầy đủ"
                              required
                            />
                          </div>
                        </div>

                        {/* Email (Không cho sửa) */}
                        <div className="p-4 bg-gray-100/50 border border-gray-100 rounded-2xl opacity-75">
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                            Email đăng nhập (Không thể thay đổi)
                          </label>
                          <div className="flex items-center gap-2.5 text-gray-500 font-semibold text-sm break-all py-2">
                            <Mail className="h-4.5 w-4.5 text-gray-400" />
                            <span>{profile?.email}</span>
                          </div>
                        </div>

                        {/* Nhập Số điện thoại */}
                        <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl">
                          <label htmlFor="editPhone" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                            Số điện thoại
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                            <input
                              type="tel"
                              id="editPhone"
                              disabled={isSubmitting}
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value.replace(/(?!^\+)[^\d]/g, ""))}
                              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white/50 text-gray-700 font-semibold text-sm disabled:opacity-50"
                              placeholder="Số điện thoại cá nhân"
                            />
                          </div>
                        </div>

                        {/* Ngày tham gia (Đọc duy nhất) */}
                        <div className="p-4 bg-gray-100/50 border border-gray-100 rounded-2xl opacity-75">
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                            Thành viên từ ngày
                          </label>
                          <div className="flex items-center gap-2.5 text-gray-500 font-semibold text-sm py-2">
                            <Calendar className="h-4.5 w-4.5 text-gray-400" />
                            <span>{formatDate(profile?.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Các nút bấm hành động */}
                      <div className="flex gap-4 justify-end border-t border-gray-100 pt-6 mt-4">
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={handleCancelEdit}
                          className="px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                        >
                          Hủy bỏ
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 hover:shadow-lg active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <>
                              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              <span>Đang lưu...</span>
                            </>
                          ) : (
                            <span>Lưu thay đổi</span>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </motion.div>
              )}

              {activeTab === "security" && (
                /* TAB 2: CÀI ĐẶT BẢO MẬT */
                <motion.div
                  key="security-tab"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800">Cài đặt bảo mật</h3>
                    {isSecurityFormOpen && (
                      <span className="text-xs font-medium text-gray-400">Đang thay đổi mật khẩu...</span>
                    )}
                  </div>

                  {!isSecurityFormOpen ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 bg-gray-50/50 border border-gray-100 rounded-2xl space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <div>
                          <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <KeyRound className="h-4.5 w-4.5 text-blue-600" />
                            <span>Đổi mật khẩu chủ động</span>
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            Thay đổi mật khẩu đăng nhập định kỳ để tăng mức an toàn cho tài khoản.
                          </p>
                        </div>
                        <button
                          onClick={() => setIsSecurityFormOpen(true)}
                          className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-all active:scale-95 whitespace-nowrap"
                        >
                          Đổi mật khẩu
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.form
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onSubmit={handleChangePassword}
                      className="space-y-5"
                    >
                      <div className="grid sm:grid-cols-2 gap-5">
                        {/* Mật khẩu hiện tại */}
                        <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl">
                          <label htmlFor="oldPass" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                            Mật khẩu hiện tại
                          </label>
                          <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                            <input
                              type={showOldPassword ? "text" : "password"}
                              id="oldPass"
                              disabled={isChangingPassword}
                              value={oldPassword}
                              onChange={(e) => setOldPassword(e.target.value)}
                              className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white/50 text-gray-700 font-semibold text-sm disabled:opacity-50"
                              placeholder="••••••••"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowOldPassword(!showOldPassword)}
                              tabIndex={-1}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              {showOldPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Mẹo an toàn */}
                        <div className="p-4 bg-blue-50/20 border border-blue-50/50 rounded-2xl flex items-center">
                          <div className="text-xs text-blue-600/80 font-semibold leading-relaxed">
                            💡 Mẹo an toàn: Mật khẩu mạnh nên chứa ít nhất 8 ký tự, bao gồm cả chữ hoa, chữ thường và chữ số để có độ an toàn tốt nhất.
                          </div>
                        </div>

                        {/* Mật khẩu mới */}
                        <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl">
                          <label htmlFor="newPass" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                            Mật khẩu mới
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                            <input
                              type={showNewPassword ? "text" : "password"}
                              id="newPass"
                              disabled={isChangingPassword}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white/50 text-gray-700 font-semibold text-sm disabled:opacity-50"
                              placeholder="••••••••"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              tabIndex={-1}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              {showNewPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Xác nhận mật khẩu mới */}
                        <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl">
                          <label htmlFor="confirmPass" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                            Xác nhận mật khẩu mới
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              id="confirmPass"
                              disabled={isChangingPassword}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white/50 text-gray-700 font-semibold text-sm disabled:opacity-50"
                              placeholder="••••••••"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              tabIndex={-1}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Các nút bấm hành động */}
                      <div className="flex gap-4 justify-end border-t border-gray-100 pt-6 mt-4">
                        <button
                          type="button"
                          disabled={isChangingPassword}
                          onClick={() => {
                            setOldPassword("");
                            setNewPassword("");
                            setConfirmPassword("");
                            setIsSecurityFormOpen(false);
                          }}
                          className="px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                        >
                          Hủy bỏ
                        </button>
                        <button
                          type="submit"
                          disabled={isChangingPassword}
                          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 hover:shadow-lg active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {isChangingPassword ? (
                            <>
                              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              <span>Đang cập nhật...</span>
                            </>
                          ) : (
                            <span>Cập nhật mật khẩu</span>
                          )}
                        </button>
                      </div>
                    </motion.form>
                  )}
                </motion.div>
              )}

              {activeTab === "notifications" && (
                /* TAB 3: THÔNG BÁO (MOCK UI CHỜ TÍCH HỢP) */
                <motion.div
                  key="notifications-tab"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <h3 className="text-lg font-bold text-gray-800">Cài đặt thông báo</h3>
                  <div className="p-6 bg-gray-50/50 border border-gray-100 rounded-2xl text-center space-y-2">
                    <p className="text-sm font-semibold text-gray-600">Bạn sẽ nhận được thông báo qua các kênh đã chọn.</p>
                    <p className="text-xs text-gray-400">Các tùy chỉnh thông báo SMS, Email và App Push sẽ được cập nhật tại đây.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
