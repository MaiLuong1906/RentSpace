"use client";

import Link from "next/link";
import { Users, Home, Shield, Flag, Clock } from "lucide-react";

export default function AdminDashboard() {
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
              <span className="text-sm text-green-600">+12.5%</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">2,547</div>
            <div className="text-sm text-gray-600">Tổng người dùng</div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Home className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-sm text-green-600">+8.2%</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">1,234</div>
            <div className="text-sm text-gray-600">Tin đăng đang hoạt động</div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <span className="text-sm text-red-600">Cần xử lý</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">23</div>
            <div className="text-sm text-gray-600">KYC chờ duyệt</div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <Flag className="h-6 w-6 text-red-600" />
              </div>
              <span className="text-sm text-red-600">Cần xử lý</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">7</div>
            <div className="text-sm text-gray-600">Báo cáo vi phạm</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/app/admin/kyc"
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Duyệt KYC</h3>
                <p className="text-sm text-gray-600">23 hồ sơ chờ xét duyệt</p>
              </div>
            </div>
            <div className="text-sm text-blue-600 font-semibold">
              Xem tất cả →
            </div>
          </Link>

          <Link
            href="/app/admin/listings"
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Home className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Quản lý tin đăng</h3>
                <p className="text-sm text-gray-600">15 tin mới chờ duyệt</p>
              </div>
            </div>
            <div className="text-sm text-purple-600 font-semibold">
              Xem tất cả →
            </div>
          </Link>

          <Link
            href="/app/admin/reports"
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <Flag className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Xử lý báo cáo</h3>
                <p className="text-sm text-gray-600">7 báo cáo cần xử lý</p>
              </div>
            </div>
            <div className="text-sm text-red-600 font-semibold">
              Xem tất cả →
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">Hoạt động gần đây</h2>
          <div className="space-y-4">
            {[
              { user: "Nguyễn Văn A", action: "đã đăng ký tài khoản mới", time: "5 phút trước" },
              { user: "Trần Thị B", action: "đã nộp hồ sơ KYC", time: "15 phút trước" },
              { user: "Lê Minh C", action: "đã đăng tin phòng trọ mới", time: "30 phút trước" },
              { user: "Phạm Thị D", action: "đã báo cáo tin đăng vi phạm", time: "1 giờ trước" },
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900">
                    <strong>{activity.user}</strong> {activity.action}
                  </p>
                  <p className="text-sm text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
