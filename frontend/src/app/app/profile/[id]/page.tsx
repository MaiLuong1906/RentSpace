"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  User, 
  Calendar, 
  ShieldCheck, 
  MessageSquare, 
  Building2, 
  MapPin, 
  Star, 
  ArrowLeft,
  Mail,
  Phone
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { formatPrice, getRoomTypeLabel } from "@/lib/mockData";
import { userApi } from "@/lib/api/user.api";
import { useListings } from "@/hooks/useListings";
import { ReviewList } from "@/components/reviews/ReviewList";

interface PublicProfile {
  id: number;
  fullName: string;
  avatarUrl: string | null;
  role: "TENANT" | "LANDLORD" | "ADMIN";
  createdAt: string;
}

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: userIdStr } = use(params);
  // Extract digits robustly to support both raw numeric IDs and string landlord IDs
  const digitsOnly = userIdStr.replace(/\D/g, "");
  const userId = digitsOnly ? parseInt(digitsOnly, 10) : 1;
  const { data: session } = useSession();

  // Lấy danh sách tin đăng của landlord từ API thực tế
  const { data: listingsData } = useListings({ page: 0, size: 20 });
  const landlordListings = listingsData?.data?.content?.filter(
    (l) => l.landlordId === userId
  ) ?? [];

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"listings" | "reviews">("listings");

  useEffect(() => {
    const fetchPublicProfile = async () => {
      try {
        const result = await userApi.getUserProfile(userId);
        if (result.success && result.data) {
          setProfile(result.data as PublicProfile);
        } else {
          setProfile({
            id: userId,
            fullName: `Người dùng #${userId}`,
            avatarUrl: null,
            role: "LANDLORD",
            createdAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error("Fetch public profile error:", error);
        setProfile({
          id: userId,
          fullName: `Người dùng #${userId}`,
          avatarUrl: null,
          role: "LANDLORD",
          createdAt: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPublicProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Đang tải hồ sơ...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Không tìm thấy người dùng</h2>
          <p className="text-gray-600 mb-6">Tài khoản này không tồn tại hoặc đã bị vô hiệu hóa khỏi hệ thống.</p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Quay lại</span>
          </button>
        </div>
      </div>
    );
  }

  const isLandlord = profile.role === "LANDLORD";
  const displayRole = profile.role === "ADMIN" ? "Quản trị viên" : isLandlord ? "Chủ nhà" : "Người thuê";

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Background Banner Decoration */}
      <div className="h-48 w-full bg-blue-600 relative">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-6xl mx-auto px-4 h-full flex items-end">
          <button
            onClick={() => router.back()}
            className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-lg font-medium transition-all shadow-sm border border-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {/* Main Info Card */}
        <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-6 md:p-8 -mt-20 relative z-10 border border-gray-100 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              {/* Avatar Container */}
              <div className="relative">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.fullName}
                    className="w-28 h-28 rounded-full border-4 border-white shadow-lg object-cover bg-gray-100"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full border-4 border-white shadow-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-4xl">
                    {profile.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="absolute bottom-1 right-1 bg-green-500 border-2 border-white w-5 h-5 rounded-full" title="Đang hoạt động"></span>
              </div>

              {/* Name & Badges */}
              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{profile.fullName}</h1>
                  <span title="Đã xác minh danh tính">
                    <ShieldCheck className="h-6 w-6 text-blue-600" />
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-gray-600">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    profile.role === "ADMIN" 
                      ? "bg-red-100 text-red-700" 
                      : isLandlord 
                      ? "bg-blue-100 text-blue-700"
                      : "bg-green-100 text-green-700"
                  }`}>
                    {displayRole}
                  </span>

                  <span className="flex items-center gap-1.5 text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>Đã tham gia: {new Date(profile.createdAt).toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/app/messages?userId=${profile.id}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                <MessageSquare className="h-5 w-5" />
                <span>Nhắn tin ngay</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        {isLandlord ? (
          <div className="space-y-6">
            <div className="border-b border-gray-200">
              <nav className="flex gap-6">
                <button
                  onClick={() => setActiveTab("listings")}
                  className={`pb-4 text-base font-semibold border-b-2 transition-all ${
                    activeTab === "listings"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Tin đăng cho thuê ({landlordListings.length})
                </button>
                <button
                  onClick={() => setActiveTab("reviews")}
                  className={`pb-4 text-base font-semibold border-b-2 transition-all ${
                    activeTab === "reviews"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Đánh giá chủ nhà
                </button>
              </nav>
            </div>

            {activeTab === "listings" ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {landlordListings.length > 0 ? (
                  landlordListings.map((listing) => (
                    <Link
                      key={listing.id}
                      href={`/app/listings/${listing.id}`}
                      className="bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 border border-gray-100 flex flex-col"
                    >
                      <div className="relative h-48 bg-gray-200">
                        <img
                          src={listing.images?.[0]?.imageUrl ?? "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-blue-600 shadow-sm border border-gray-100">
                          {formatPrice(listing.pricePerMonth)}/tháng
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-gray-900 mb-2 line-clamp-1 hover:text-blue-600 transition-colors">
                            {listing.title}
                          </h3>

                          <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-3">
                            <MapPin className="h-4 w-4 flex-shrink-0 text-gray-400" />
                            <span className="line-clamp-1">{listing.address}, {listing.district}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-50">
                          <div className="flex items-center gap-3 text-gray-500 font-medium">
                            {listing.areaM2 && <span>{listing.areaM2} m²</span>}
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            listing.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                          }`}>
                            {listing.status === "ACTIVE" ? "Còn trống" : listing.status}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-full bg-white rounded-2xl p-12 text-center border border-gray-100">
                    <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-700 mb-2">Chưa có bài đăng nào</h3>
                    <p className="text-gray-500">Chủ nhà này hiện chưa đăng tải thông tin phòng trọ nào lên RentSpace.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <ReviewList userId={userId} />
              </div>
            )}
          </div>
        ) : (
          /* Tenant Profile view */
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-4">Đánh giá từ chủ trọ</h3>
              <ReviewList userId={userId} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
