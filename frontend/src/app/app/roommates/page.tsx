"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Sparkles, 
  User, 
  MapPin, 
  Calendar, 
  DollarSign, 
  MessageSquare, 
  X, 
  PlusCircle, 
  UserPlus, 
  Edit3, 
  EyeOff, 
  AlertCircle
} from "lucide-react";
import { roommateApi } from "@/lib/api/roommate.api";
import { kycApi } from "@/lib/api/kyc.api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { RoommateProfile, RoommateMatch } from "@/types/phase2.types";

export default function RoommateDashboard() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [kycVerified, setKycVerified] = useState<boolean | null>(null);
  const [myProfile, setMyProfile] = useState<RoommateProfile | null>(null);
  const [suggestions, setSuggestions] = useState<RoommateMatch[]>([]);
  const [dismissingIds, setDismissingIds] = useState<number[]>([]);

  useEffect(() => {
    if (authStatus === "loading") return;

    if (authStatus === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        // Kiểm tra KYC
        const kycRes = await kycApi.getKycStatus();
        const isVerified = kycRes.success && kycRes.data?.status === "VERIFIED";
        setKycVerified(isVerified);

        if (!isVerified) {
          setLoading(false);
          return;
        }

        // Tải hồ sơ của tôi
        let hasProfile = false;
        try {
          const profileRes = await roommateApi.getProfile();
          if (profileRes.success && profileRes.data) {
            setMyProfile(profileRes.data);
            hasProfile = true;
          }
        } catch (err: unknown) {
          const apiError = err as { response?: { status?: number } };
          if (apiError.response?.status !== 404) {
            console.error("Lỗi khi tải hồ sơ:", err);
          }
        }

        // Tải danh sách gợi ý nếu đã có hồ sơ
        if (hasProfile) {
          const suggestionsRes = await roommateApi.getSuggestions();
          if (suggestionsRes.success) {
            setSuggestions(suggestionsRes.data || []);
          }
        }
      } catch (error) {
        console.error("Lỗi tải thông tin dashboard:", error);
        toast.error("Không thể tải thông tin gợi ý bạn ở ghép.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [authStatus, router]);

  const handleDismiss = async (matchId: number) => {
    try {
      setDismissingIds(prev => [...prev, matchId]);
      const res = await roommateApi.dismissMatch(matchId);
      if (res.success) {
        toast.success("Đã từ chối gợi ý này.");
        // Chờ hiệu ứng trượt kết thúc rồi mới xoá khỏi state
        setTimeout(() => {
          setSuggestions(prev => prev.filter(item => item.id !== matchId));
          setDismissingIds(prev => prev.filter(id => id !== matchId));
        }, 300);
      }
    } catch (error) {
      console.error("Lỗi từ chối gợi ý:", error);
      toast.error("Không thể thực hiện thao tác này.");
      setDismissingIds(prev => prev.filter(id => id !== matchId));
    }
  };

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return "0đ";
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1).replace(".0", "")}tr`;
    }
    return `${value.toLocaleString("vi-VN")}đ`;
  };

  const getOtherProfile = (match: RoommateMatch): RoommateProfile => {
    const currentUserId = Number(session?.user?.id);
    return match.profileA.userId === currentUserId ? match.profileB : match.profileA;
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500 stroke-emerald-500 bg-emerald-50";
    if (score >= 60) return "text-amber-500 stroke-amber-500 bg-amber-50";
    return "text-slate-500 stroke-slate-500 bg-slate-50";
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return "U";
    const cleanName = name.split("(")[0].trim();
    const parts = cleanName.split(" ").filter(Boolean);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0].substring(0, 1).toUpperCase();
    const firstChar = parts[0].substring(0, 1);
    const lastChar = parts[parts.length - 1].substring(0, 1);
    return (firstChar + lastChar).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center">
        <div className="relative w-12 h-12 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
        </div>
        <p className="text-gray-500 text-sm font-semibold">Đang tải thông tin gợi ý...</p>
      </div>
    );
  }

  // Khóa tính năng nếu chưa KYC
  if (kycVerified === false) {
    return (
      <div className="min-h-[85vh] bg-gray-50/50 py-12 flex items-center justify-center px-4">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md bg-white border border-gray-150 shadow-2xl rounded-3xl p-8 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 to-rose-500" />
          <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-extrabold text-gray-800 mb-2">Yêu cầu xác thực danh tính</h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            Để sử dụng tính năng tìm bạn ở ghép, tài khoản của bạn cần được xác minh danh tính hoàn tất nhằm đảm bảo an toàn cho cộng đồng.
          </p>
          <Link
            href="/app/kyc"
            className="block w-full bg-blue-600 text-white py-3.5 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-95"
          >
            Xác thực ngay (eKYC)
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-white border border-gray-150 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-blue-600 animate-pulse" />
              Tìm bạn ở ghép
            </h1>
            <p className="text-xs text-gray-400 font-semibold">Gợi ý thông minh dựa trên lối sống, ngân sách và thói quen sinh hoạt.</p>
          </div>
          
          {myProfile && (
            <Link
              href="/app/roommates/profile"
              className="px-5 py-3 bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-600 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 shrink-0 self-start md:self-auto"
            >
              <Edit3 className="h-4.5 w-4.5" />
              <span>Chỉnh sửa hồ sơ</span>
            </Link>
          )}
        </div>

        {/* Khối chính */}
        {!myProfile ? (
          /* CHƯA CÓ HỒ SƠ */
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-gray-150 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-md"
          >
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-100">
              <UserPlus className="h-10 w-10 text-blue-600" />
            </div>
            <h2 className="text-xl font-extrabold text-gray-800 mb-3">Tạo hồ sơ ở ghép của bạn</h2>
            <p className="text-gray-400 text-xs leading-relaxed mb-8">
              Bạn chưa tạo hồ sơ tìm bạn ở ghép! Điền thông tin về thói quen sinh hoạt, ngân sách và sở thích để thuật toán AI của chúng tôi bắt đầu quét và so khớp cặp.
            </p>
            <Link
              href="/app/roommates/profile"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3.5 rounded-2xl font-extrabold shadow-lg shadow-blue-500/20 hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-xs"
            >
              <PlusCircle className="h-4.5 w-4.5" />
              <span>Tạo hồ sơ ngay</span>
            </Link>
          </motion.div>
        ) : (
          /* ĐÃ CÓ HỒ SƠ */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            
            {/* Sidebar hồ sơ của tôi */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <h3 className="text-sm font-extrabold text-gray-800">Hồ sơ của tôi</h3>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    myProfile.isActive 
                      ? "bg-emerald-50 text-emerald-700" 
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${myProfile.isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
                    {myProfile.isActive ? "Hiển thị" : "Ẩn"}
                  </span>
                </div>

                <div className="space-y-4 text-xs font-semibold text-gray-600">
                  <div className="flex items-center gap-2.5">
                    <User className="h-4.5 w-4.5 text-gray-400" />
                    <span>Nghề: {myProfile.occupation || "Chưa cập nhật"}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <DollarSign className="h-4.5 w-4.5 text-gray-400" />
                    <span>Ngân sách: {formatCurrency(myProfile.budgetMin)} - {formatCurrency(myProfile.budgetMax)}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <MapPin className="h-4.5 w-4.5 text-gray-400" />
                    <span>Khu vực: {myProfile.preferredArea}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Calendar className="h-4.5 w-4.5 text-gray-400" />
                    <span>Ngày dọn vào: {myProfile.moveInDate ? myProfile.moveInDate.split("T")[0] : "Chưa chọn"}</span>
                  </div>
                </div>

                {myProfile.lifestyleTags && myProfile.lifestyleTags.length > 0 && (
                  <div className="border-t border-gray-100 pt-4 space-y-2.5">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Thói quen nổi bật</p>
                    <div className="flex flex-wrap gap-1.5">
                      {myProfile.lifestyleTags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-bold text-gray-500">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Danh sách gợi ý */}
            <div className="lg:col-span-3 space-y-6">
              <h2 className="text-base font-extrabold text-gray-800 flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-blue-500" />
                Gợi ý tốt nhất cho bạn ({suggestions.length})
              </h2>

              {suggestions.length === 0 ? (
                /* TRỐNG GỢI Ý */
                <div className="bg-white border border-gray-150 rounded-3xl p-12 text-center shadow-sm">
                  <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <EyeOff className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-extrabold text-gray-800 mb-1">Chưa có gợi ý phù hợp</h3>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                    Hệ thống chưa tìm thấy hồ sơ tương thích. Bạn hãy thử mở rộng khoảng ngân sách hoặc thêm thói quen lối sống khác để gia tăng cơ hội kết nối.
                  </p>
                </div>
              ) : (
                /* GRID GỢI Ý */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AnimatePresence mode="popLayout">
                    {suggestions.map((match) => {
                      const otherUser = getOtherProfile(match);
                      const isDismissing = dismissingIds.includes(match.id);
                      const score = Math.round(match.matchScore);
                      const scoreColor = getMatchScoreColor(score);
                      const avatarSrc = otherUser.avatar;

                      // Tính toán số lượng thẻ trùng lối sống
                      const myTags = myProfile.lifestyleTags || [];
                      const otherTags = otherUser.lifestyleTags || [];
                      
                      return (
                        <motion.div
                          key={match.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: isDismissing ? 0 : 1, scale: isDismissing ? 0.9 : 1, x: isDismissing ? -100 : 0 }}
                          exit={{ opacity: 0, scale: 0.9, x: -100 }}
                          transition={{ duration: 0.25 }}
                          className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden"
                        >
                          {/* Match Score Badge (Vành tròn SVG phía trên bên phải) */}
                          <div className="absolute top-4 right-4 flex items-center gap-1.5">
                            <div className="relative w-11 h-11 flex items-center justify-center">
                              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                <path
                                  className="text-slate-100 stroke-current"
                                  strokeWidth="3.5"
                                  fill="none"
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                <path
                                  className={`stroke-current ${scoreColor.split(" ")[1]}`}
                                  strokeWidth="3.5"
                                  strokeDasharray={`${score}, 100`}
                                  strokeLinecap="round"
                                  fill="none"
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                              </svg>
                              <span className="absolute text-[11px] font-extrabold text-gray-800">{score}%</span>
                            </div>
                          </div>

                          <div className="space-y-4">
                            
                            {/* Avatar & Thông tin cá nhân */}
                            <div className="flex items-center gap-3">
                              {avatarSrc ? (
                                <div className="relative w-12 h-12 rounded-full overflow-hidden border border-gray-150 bg-gray-50 flex-shrink-0">
                                  <Image
                                    src={avatarSrc}
                                    alt={otherUser.fullName || "Avatar"}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded-full border border-blue-100 bg-gradient-to-tr from-blue-50 to-indigo-50 flex items-center justify-center flex-shrink-0 shadow-inner">
                                  <span className="text-xs font-extrabold text-blue-600 uppercase">
                                    {getInitials(otherUser.fullName)}
                                  </span>
                                </div>
                              )}
                              <div className="min-w-0 pr-12">
                                <h3 className="text-sm font-extrabold text-gray-800 truncate">
                                  {otherUser.fullName}
                                </h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-gray-400 font-semibold truncate">
                                    {otherUser.occupation || "Nghề tự do"}
                                  </span>
                                  <span className="h-1 w-1 bg-gray-300 rounded-full flex-shrink-0" />
                                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">
                                    {otherUser.gender === "Male" ? "Nam" : otherUser.gender === "Female" ? "Nữ" : "Khác"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Giới thiệu bản thân */}
                            {otherUser.bio && (
                              <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                                {otherUser.bio}
                              </p>
                            )}

                            {/* Các trường so khớp */}
                            <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-gray-600 bg-gray-50/50 border border-gray-100 rounded-2xl p-3">
                              <div className="flex items-center gap-1.5">
                                <DollarSign className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                <span className="truncate">Ngân sách: {formatCurrency(otherUser.budgetMin)} - {formatCurrency(otherUser.budgetMax)}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                <span className="truncate">Khu vực: {otherUser.preferredArea}</span>
                              </div>
                              <div className="flex items-center gap-1.5 col-span-2">
                                <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                <span>Ngày dọn vào: {otherUser.moveInDate ? otherUser.moveInDate.split("T")[0] : "Chưa chọn"}</span>
                              </div>
                            </div>

                            {/* Nhãn lối sống so khớp */}
                            {otherTags.length > 0 && (
                              <div className="space-y-1.5">
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Thói quen & lối sống</p>
                                <div className="flex flex-wrap gap-1">
                                  {otherTags.map(tag => {
                                    const isMatch = myTags.includes(tag);
                                    return (
                                      <span
                                        key={tag}
                                        className={`px-2 py-0.5 rounded-md text-[9px] font-bold border transition-colors ${
                                          isMatch
                                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                            : "bg-gray-50 border-gray-150 text-gray-500"
                                        }`}
                                      >
                                        {tag}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                          </div>

                          {/* Hành động */}
                          <div className="flex items-center gap-2 mt-6 border-t border-gray-100 pt-4">
                            <button
                              onClick={() => handleDismiss(match.id)}
                              disabled={isDismissing}
                              className="px-3 py-3 border border-gray-200 hover:border-red-200 text-gray-500 hover:text-red-600 rounded-2xl transition-colors hover:bg-red-50/20 active:scale-95 shrink-0"
                              title="Bỏ qua gợi ý"
                            >
                              <X className="h-4.5 w-4.5" />
                            </button>
                            <Link
                              href={`/app/messages?userId=${otherUser.userId}`}
                              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                            >
                              <MessageSquare className="h-4 w-4" />
                              <span>Nhắn tin trò chuyện</span>
                            </Link>
                          </div>

                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
