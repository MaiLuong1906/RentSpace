"use client";

import { useState } from "react";
import Link from "next/link";
import { User, Mail, Phone, MapPin, Shield, Edit2, Camera } from "lucide-react";
import { mockCurrentUser } from "@/lib/mockData";

export default function ProfilePage() {
  const [user] = useState(mockCurrentUser);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Hồ sơ của tôi</h1>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Avatar Card */}
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="relative inline-block mb-4">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-32 h-32 rounded-full mx-auto"
              />
              <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <h2 className="text-xl font-semibold mb-1">{user.name}</h2>
            <p className="text-gray-600 text-sm mb-4">{user.role === "tenant" ? "Người thuê" : "Chủ trọ"}</p>

            {user.verified ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm">
                <Shield className="h-4 w-4" />
                Đã xác thực KYC
              </div>
            ) : (
              <Link
                href="/app/kyc"
                className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg text-sm hover:bg-yellow-100"
              >
                <Shield className="h-4 w-4" />
                Xác thực tài khoản
              </Link>
            )}
          </div>

          {/* Info Card */}
          <div className="md:col-span-2 bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Thông tin cá nhân</h3>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                <Edit2 className="h-4 w-4" />
                {isEditing ? "Hủy" : "Chỉnh sửa"}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Họ và tên
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    defaultValue={user.name}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-gray-900">
                    <User className="h-5 w-5 text-gray-400" />
                    <span>{user.name}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="flex items-center gap-2 text-gray-900">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <span>{user.email}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    defaultValue={user.phone}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-gray-900">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <span>{user.phone}</span>
                  </div>
                )}
              </div>

              {isEditing && (
                <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">
                  Lưu thay đổi
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Additional Sections */}
        <div className="mt-6 bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Cài đặt tài khoản</h3>
          <div className="space-y-3">
            <Link
              href="/app/kyc"
              className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-gray-600" />
                <span>Xác thực danh tính (KYC)</span>
              </div>
              <span className="text-sm text-gray-500">→</span>
            </Link>

            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg text-left">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-600" />
                <span>Đổi mật khẩu</span>
              </div>
              <span className="text-sm text-gray-500">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
