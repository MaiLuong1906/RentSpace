"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Users, Home, Shield, Flag, Clock, UserCheck, ShieldAlert, AlertTriangle, CreditCard, Building2 } from "lucide-react";
import { userApi } from "@/lib/api/user.api";
import { listingApi } from "@/lib/api/listing.api";
import { kycApi } from "@/lib/api/kyc.api";
import { ApiResponse, PageResponse } from "@/types/api.types";

export default function AdminDashboard() {
  const { data: session, status: authStatus } = useSession();
  const fetchedRef = useRef(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeListings: 0,
    pendingKyc: 0,
    reportsCount: 7, // Hỗ trợ báo cáo giữ nguyên hoặc load sau
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardStats = async () => {
      if (!session?.accessToken || session?.user?.role !== "ADMIN") return;
      try {
        setLoading(true);
        
        // Chạy song song các API thống kê để tối ưu tốc độ tải
        const [usersRes, listingsRes, kycRes] = await Promise.all([
          userApi.getAllUsers().catch(() => ({ success: false, data: [] })),
          listingApi.getAdminListings({ status: "ACTIVE", size: 1 }).catch(() => ({
            success: false,
            message: "Error",
            timestamp: "",
            data: { content: [], totalElements: 0 }
          } as ApiResponse<PageResponse<import("@/types/listing.types").Listing>>)),
          kycApi.getPendingList().catch(() => ({ success: false, data: [] }))
        ]);

        const usersCount = usersRes.success && usersRes.data ? usersRes.data.length : 0;
        
        // Lấy totalElements từ listings page response
        let listingsCount = 0;
        if (listingsRes.success && listingsRes.data) {
          listingsCount = listingsRes.data.totalElements ?? listingsRes.data.page?.totalElements ?? 0;
        }

        const kycCount = kycRes.success && kycRes.data ? kycRes.data.length : 0;

        setStats({
          totalUsers: usersCount,
          activeListings: listingsCount,
          pendingKyc: kycCount,
          reportsCount: 7, // Giữ mock hoặc mock tạm thời
        });
      } catch (error) {
        console.error("Lỗi tải thông tin dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    if (authStatus === "authenticated") {
      if (session?.user?.role === "ADMIN" && session?.accessToken && !fetchedRef.current) {
        fetchedRef.current = true;
        loadDashboardStats();
      }
    }
  }, [session, authStatus]);

  if (authStatus === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Clock className="h-10 w-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (authStatus === "unauthenticated" || session?.user?.role !== "ADMIN") {
    return (
      <div className="min-h-[85vh] bg-gray-50/50 py-12 flex items-center justify-center px-4">
        <div className="max-w-md bg-white border border-gray-100 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-3xl p-8 text-center">
          <ShieldAlert className="h-14 w-14 text-red-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-extrabold text-gray-800 mb-2">Quyền truy cập bị giới hạn</h2>
          <p className="text-gray-500 text-sm mb-6">
            Bạn cần đăng nhập tài khoản có quyền quản trị viên (ADMIN) để xem thông tin trang quản trị.
          </p>
          <Link
            href="/"
            className="block w-full bg-gray-900 text-white py-3 rounded-2xl font-bold hover:bg-gray-800 transition-all text-sm text-center"
          >
            Trở về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-sm text-green-600 font-semibold">Hệ thống</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? "..." : stats.totalUsers}
            </div>
            <div className="text-sm text-gray-600">Tổng người dùng</div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Home className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-sm text-green-600 font-semibold">Đang duyệt</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? "..." : stats.activeListings}
            </div>
            <div className="text-sm text-gray-600">Tin đăng đang hoạt động</div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <span className="text-sm text-red-600 font-semibold">Cần xử lý</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? "..." : stats.pendingKyc}
            </div>
            <div className="text-sm text-gray-600">KYC chờ duyệt</div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <Flag className="h-6 w-6 text-red-600" />
              </div>
              <span className="text-sm text-red-600 font-semibold">Cần xử lý</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? "..." : stats.reportsCount}
            </div>
            <div className="text-sm text-gray-600">Báo cáo vi phạm</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link
            href="/app/admin/kyc"
            className="bg-white rounded-2xl border border-gray-150 shadow-sm p-8 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-blue-50 rounded-xl flex-shrink-0">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Duyệt KYC</h3>
                <p className="text-xs text-gray-500 font-semibold mt-1">
                  {loading ? "Đang tải..." : `${stats.pendingKyc} hồ sơ chờ duyệt`}
                </p>
              </div>
            </div>
            <div className="text-xs text-blue-600 font-bold mt-2">
              Xem tất cả →
            </div>
          </Link>

          <Link
            href="/app/admin/listings"
            className="bg-white rounded-2xl border border-gray-150 shadow-sm p-8 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-blue-50 rounded-xl flex-shrink-0">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Quản lý tin</h3>
                <p className="text-xs text-gray-500 font-semibold mt-1">Kiểm duyệt bài viết phòng trọ</p>
              </div>
            </div>
            <div className="text-xs text-blue-600 font-bold mt-2">
              Xem tất cả →
            </div>
          </Link>

          <Link
            href="/app/admin/users"
            className="bg-white rounded-2xl border border-gray-150 shadow-sm p-8 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-emerald-50 rounded-xl flex-shrink-0">
                <UserCheck className="h-8 w-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Quản lý User</h3>
                <p className="text-xs text-gray-500 font-semibold mt-1">
                  {loading ? "Đang tải..." : `${stats.totalUsers} thành viên hệ thống`}
                </p>
              </div>
            </div>
            <div className="text-xs text-emerald-600 font-bold mt-2">
              Xem tất cả →
            </div>
          </Link>

          <Link
            href="/app/admin/reports"
            className="bg-white rounded-2xl border border-gray-150 shadow-sm p-8 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-red-50 rounded-xl flex-shrink-0">
                <Flag className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Xử lý báo cáo</h3>
                <p className="text-xs text-gray-500 font-semibold mt-1">Các bài viết bị báo cáo vi phạm</p>
              </div>
            </div>
            <div className="text-xs text-red-600 font-bold mt-2">
              Xem tất cả →
            </div>
          </Link>

          <Link
            href="/app/admin/disputes"
            className="bg-white rounded-2xl border border-gray-150 shadow-sm p-8 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-amber-50 rounded-xl flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Tranh chấp</h3>
                <p className="text-xs text-gray-500 font-semibold mt-1">Giải quyết tranh chấp cọc</p>
              </div>
            </div>
            <div className="text-xs text-amber-600 font-bold mt-2">
              Xem tất cả →
            </div>
          </Link>

          <Link
            href="/app/admin/payouts"
            className="bg-white rounded-2xl border border-gray-150 shadow-sm p-8 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-green-50 rounded-xl flex-shrink-0">
                <CreditCard className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Đối soát</h3>
                <p className="text-xs text-gray-500 font-semibold mt-1">Giải ngân tiền cọc chủ nhà</p>
              </div>
            </div>
            <div className="text-xs text-green-600 font-bold mt-2">
              Xem tất cả →
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
