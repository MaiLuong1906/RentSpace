"use client";

import Link from "next/link";
import { useMyListings } from "@/hooks/useListings";
import {
  PlusCircle,
  Building2,
  BarChart3,
  ShieldCheck,
  Zap,
  CreditCard,
  Loader2,
} from "lucide-react";

export default function LandlordDashboard() {
  const { data: apiResponse, isLoading } = useMyListings();
  const myListings = apiResponse?.data?.content || [];

  const total = myListings.length;
  const active = myListings.filter((l) => l.status === "ACTIVE").length;
  const pending = myListings.filter((l) => l.status === "PENDING").length;
  const rented = myListings.filter((l) => l.status === "RENTED").length;

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Chủ nhà</h1>
        <p className="text-gray-500 text-sm mt-1">
          Tổng quan hoạt động kinh doanh phòng trọ của bạn trên RentSpace.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "Tổng tin đăng", value: total, bg: "bg-white border-gray-200", text: "text-gray-900" },
          { label: "Đang hiển thị", value: active, bg: "bg-emerald-50 border-emerald-100", text: "text-emerald-700" },
          { label: "Chờ phê duyệt", value: pending, bg: "bg-amber-50 border-amber-100", text: "text-amber-700" },
          { label: "Đã cho thuê", value: rented, bg: "bg-blue-50 border-blue-100", text: "text-blue-700" },
        ].map((card, idx) => (
          <div key={idx} className={`p-6 rounded-2xl border shadow-sm ${card.bg}`}>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{card.label}</span>
            <div className={`text-3xl font-extrabold mt-2 ${card.text}`}>
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-gray-300" /> : card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Nghiệp vụ nhanh</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Đăng tin mới", path: "/app/landlord/create-listing", icon: PlusCircle, bg: "bg-blue-600 text-white hover:bg-blue-700" },
            { label: "Quản lý phòng", path: "/app/landlord/my-listings", icon: Building2, bg: "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 animate-none" },
            { label: "Thống kê doanh thu", path: "/app/landlord/analytics", icon: BarChart3, bg: "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50" },
            { label: "Lịch sử đặt cọc", path: "/app/deposits", icon: ShieldCheck, bg: "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50" },
            { label: "Gói hội viên", path: "/app/landlord/subscription", icon: Zap, bg: "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50" },
            { label: "Giải ngân tiền cọc", path: "/app/landlord/payout", icon: CreditCard, bg: "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50" },
          ].map((act, idx) => (
            <Link
              key={idx}
              href={act.path}
              className={`flex flex-col items-center justify-center p-5 rounded-2xl transition-all font-semibold text-xs text-center gap-3 ${act.bg}`}
            >
              <act.icon className="h-6 w-6 shrink-0" />
              <span>{act.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent listings preview */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Tin đăng gần đây</h2>
          <Link href="/app/landlord/my-listings" className="text-xs font-bold text-blue-600 hover:text-blue-700">
            Xem tất cả
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
          </div>
        ) : myListings.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Bạn chưa có bài đăng nào.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {myListings.slice(0, 3).map((l) => (
              <div key={l.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                    <img
                      src={l.images?.[0]?.imageUrl || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=100&h=100&fit=crop"}
                      alt={l.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-gray-900 line-clamp-1">{l.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{l.district || "Đà Nẵng"} • {new Intl.NumberFormat("vi-VN").format(l.pricePerMonth)}đ/tháng</p>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  l.status === 'ACTIVE'
                    ? "bg-green-50 text-green-700"
                    : l.status === 'PENDING'
                    ? "bg-yellow-50 text-yellow-700"
                    : "bg-gray-100 text-gray-500"
                }`}>
                  {l.status === 'ACTIVE' ? 'Đang hiển thị' : l.status === 'PENDING' ? 'Chờ duyệt' : l.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
