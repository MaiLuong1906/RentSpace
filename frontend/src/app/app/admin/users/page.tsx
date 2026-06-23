"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { 
  Users, 
  ShieldAlert, 
  RefreshCw, 
  Search, 
  MessageSquare, 
  User as UserIcon, 
  ShieldCheck, 
  ShieldEllipsis, 
  ShieldX, 
  Mail, 
  Phone, 
  Calendar,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { userApi } from "@/lib/api/user.api";
import { User } from "@/types/user.types";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminUsersPage() {
  const { data: session, status: authStatus } = useSession();
  const fetchedRef = useRef(false);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "LANDLORD" | "TENANT" | "ADMIN">("ALL");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Fetch users from Backend
  const fetchUsers = async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      const res = await userApi.getAllUsers();
      if (res.success && res.data) {
        setUsers(res.data);
      } else {
        toast.error("Không thể tải danh sách người dùng.");
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách người dùng admin:", error);
      toast.error("Đã xảy ra lỗi kết nối khi tải danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authStatus === "loading") return;

    if (authStatus === "authenticated") {
      if (session?.user?.role !== "ADMIN") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(false);
      } else if (session?.accessToken && !fetchedRef.current) {
        fetchedRef.current = true;
        fetchUsers();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, authStatus]);

  // Thống kê động từ client-side list
  const totalUsers = users.length;
  const landlordsCount = users.filter(u => u.role === "LANDLORD").length;
  const tenantsCount = users.filter(u => u.role === "TENANT").length;
  const adminsCount = users.filter(u => u.role === "ADMIN").length;

  // Lọc danh sách theo vai trò và ô tìm kiếm
  const filteredUsers = users.filter(user => {
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    const matchesSearch = 
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phoneNumber && user.phoneNumber.includes(searchTerm));
    return matchesRole && matchesSearch;
  });

  // Render KYC Badge
  const renderKycBadge = (status: User["kycStatus"]) => {
    switch (status) {
      case "VERIFIED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
            <ShieldCheck className="h-3 w-3 text-emerald-600" />
            <span>Đã KYC</span>
          </span>
        );
      case "PENDING":
      case "SUBMITTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 animate-pulse">
            <ShieldEllipsis className="h-3 w-3 text-blue-600" />
            <span>Chờ duyệt</span>
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">
            <ShieldX className="h-3 w-3 text-rose-600" />
            <span>Bị từ chối</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
            <span>Chưa KYC</span>
          </span>
        );
    }
  };

  // Render Role Badge
  const renderRoleBadge = (role: User["role"]) => {
    switch (role) {
      case "ADMIN":
        return (
          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-150 uppercase tracking-wider">
            Quản trị viên
          </span>
        );
      case "LANDLORD":
        return (
          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider">
            Chủ trọ
          </span>
        );
      default:
        return (
          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-150 uppercase tracking-wider">
            Người thuê
          </span>
        );
    }
  };

  // Format Date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Loading indicator
  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 py-12 flex flex-col items-center justify-center">
        <RefreshCw className="h-10 w-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 text-sm font-semibold">Đang tải danh sách người dùng...</p>
      </div>
    );
  }

  // Access check
  if (authStatus === "unauthenticated" || session?.user?.role !== "ADMIN") {
    return (
      <div className="min-h-[85vh] bg-gray-50/50 py-12 flex items-center justify-center px-4">
        <div className="max-w-md bg-white border border-gray-100 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-3xl p-8 text-center">
          <ShieldAlert className="h-14 w-14 text-red-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-extrabold text-gray-800 mb-2">Quyền truy cập bị giới hạn</h2>
          <p className="text-gray-500 text-sm mb-6">
            Bạn cần đăng nhập tài khoản có quyền quản trị viên (ADMIN) để xem danh sách và quản lý người dùng.
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
    <div className="min-h-screen bg-gray-50/50 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">
              Quản lý người dùng hệ thống
            </h1>
            <p className="text-xs text-gray-400 font-medium mt-1">
              Xem chi tiết hồ sơ, trạng thái xác thực danh tính KYC, vai trò và thông tin liên hệ của tất cả thành viên
            </p>
          </div>
          <button
            onClick={fetchUsers}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 self-start sm:self-auto"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Làm mới</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-gray-100 rounded-3xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-6 flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400 font-bold">Tổng thành viên</div>
              <div className="text-2xl font-extrabold text-gray-800 mt-1">{totalUsers}</div>
            </div>
            <div className="h-12 w-12 bg-blue-50 border border-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
          </div>
          
          <div className="bg-white border border-gray-100 rounded-3xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-6 flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400 font-bold">Chủ cho thuê</div>
              <div className="text-2xl font-extrabold text-gray-800 mt-1">{landlordsCount}</div>
            </div>
            <div className="h-12 w-12 bg-blue-50 border border-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
              <UserIcon className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-6 flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400 font-bold">Người thuê phòng</div>
              <div className="text-2xl font-extrabold text-gray-800 mt-1">{tenantsCount}</div>
            </div>
            <div className="h-12 w-12 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
              <UserIcon className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-6 flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400 font-bold">Quản trị viên</div>
              <div className="text-2xl font-extrabold text-gray-800 mt-1">{adminsCount}</div>
            </div>
            <div className="h-12 w-12 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-lg shadow-gray-200/20 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Role Filters */}
          <div className="flex flex-wrap gap-1.5">
            {(["ALL", "LANDLORD", "TENANT", "ADMIN"] as const).map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                  roleFilter === role
                    ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10"
                    : "bg-white text-gray-600 border-gray-150 hover:bg-gray-50"
                }`}
              >
                {role === "ALL" ? "Tất cả" : role === "LANDLORD" ? "Chủ trọ" : role === "TENANT" ? "Người thuê" : "Admin"}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, email, sđt..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-gray-50/50"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white border border-gray-100 rounded-3xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4.5 text-xs font-extrabold text-gray-400 uppercase tracking-wider">Thành viên</th>
                  <th className="px-6 py-4.5 text-xs font-extrabold text-gray-400 uppercase tracking-wider">Vai trò</th>
                  <th className="px-6 py-4.5 text-xs font-extrabold text-gray-400 uppercase tracking-wider">Trạng thái KYC</th>
                  <th className="px-6 py-4.5 text-xs font-extrabold text-gray-400 uppercase tracking-wider">Ngày tham gia</th>
                  <th className="px-6 py-4.5 text-right text-xs font-extrabold text-gray-400 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    
                    {/* User profile info */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200 flex items-center justify-center font-bold text-blue-600">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.fullName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            user.fullName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-extrabold text-gray-800 text-sm">
                            {user.fullName}
                          </div>
                          <div className="text-xs text-gray-400 font-semibold flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3" />
                            <span>{user.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-5">
                      {renderRoleBadge(user.role)}
                    </td>

                    {/* KYC status */}
                    <td className="px-6 py-5">
                      {renderKycBadge(user.kycStatus)}
                    </td>

                    {/* Join Date */}
                    <td className="px-6 py-5">
                      <div className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <span>{formatDate(user.createdAt)}</span>
                      </div>
                    </td>

                    {/* Action buttons */}
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick View Details */}
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl shadow-sm transition-all active:scale-95"
                          title="Xem chi tiết"
                        >
                          <Users className="h-4 w-4" />
                        </button>
                        
                        {/* View Public Profile page */}
                        <Link
                          href={`/app/profile/${user.id}`}
                          className="p-2 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-xl shadow-sm border border-gray-150 transition-all active:scale-95"
                          title="Trang cá nhân công khai"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>

                        {/* Chat with user */}
                        {session.user.id !== user.id && (
                          <Link
                            href={`/app/chat?userId=${user.id}`}
                            className="p-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl transition-all active:scale-95"
                            title="Gửi tin nhắn"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-16 px-4 bg-gray-50/20">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-700 mb-1">Không tìm thấy người dùng nào</h3>
              <p className="text-xs text-gray-400">Danh sách trống hoặc không có bản ghi nào khớp bộ lọc tìm kiếm.</p>
            </div>
          )}
        </div>
      </div>

      {/* User Details Modal (Preview Modal) */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] max-w-md w-full overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Header Modal */}
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-extrabold text-gray-800 font-sans">Chi tiết thành viên</h2>
                  <p className="text-xs text-gray-400 font-medium">Xem nhanh thông tin tài khoản người dùng</p>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ChevronRight className="h-6 w-6 rotate-90" />
                </button>
              </div>

              {/* Body Modal */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 flex flex-col items-center">
                {/* Large Avatar */}
                <div className="h-24 w-24 rounded-full overflow-hidden bg-blue-50 border-4 border-white shadow-lg flex items-center justify-center text-blue-600 font-bold text-3xl">
                  {selectedUser.avatarUrl ? (
                    <img src={selectedUser.avatarUrl} alt={selectedUser.fullName} className="w-full h-full object-cover" />
                  ) : (
                    selectedUser.fullName.charAt(0).toUpperCase()
                  )}
                </div>

                <div className="text-center w-full">
                  <h3 className="text-xl font-extrabold text-gray-800 leading-snug">{selectedUser.fullName}</h3>
                  <div className="flex justify-center gap-2 mt-2">
                    {renderRoleBadge(selectedUser.role)}
                    {renderKycBadge(selectedUser.kycStatus)}
                  </div>
                </div>

                {/* User Details Fields */}
                <div className="w-full space-y-3.5 bg-gray-50 border border-gray-100 p-4.5 rounded-2xl text-sm">
                  {/* Email */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 font-bold text-xs uppercase">Email</span>
                    <span className="font-extrabold text-gray-700 flex items-center gap-1">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {selectedUser.email}
                    </span>
                  </div>

                  {/* Phone number */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 font-bold text-xs uppercase">Số điện thoại</span>
                    <span className="font-extrabold text-gray-700 flex items-center gap-1">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {selectedUser.phoneNumber || "Chưa thiết lập"}
                    </span>
                  </div>

                  {/* Email status */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 font-bold text-xs uppercase">Xác thực Email</span>
                    <span className={`font-bold text-xs px-2.5 py-0.5 rounded-full ${
                      selectedUser.isEmailVerified 
                        ? "bg-green-50 text-green-700 border border-green-100" 
                        : "bg-amber-50 text-amber-700 border border-amber-100"
                    }`}>
                      {selectedUser.isEmailVerified ? "Đã xác thực" : "Chưa xác thực"}
                    </span>
                  </div>

                  {/* Joined date */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 font-bold text-xs uppercase">Ngày tham gia</span>
                    <span className="font-extrabold text-gray-700 flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {formatDate(selectedUser.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer Modal Actions */}
              <div className="p-6 border-t border-gray-100 bg-gray-50/30 flex gap-3">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 px-5 py-3 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-2xl text-xs font-bold transition-all active:scale-95"
                >
                  Đóng
                </button>
                {session.user.id !== selectedUser.id && (
                  <Link
                    href={`/app/chat?userId=${selectedUser.id}`}
                    onClick={() => setSelectedUser(null)}
                    className="flex-1 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold active:scale-95 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="h-4.5 w-4.5" />
                    <span>Nhắn tin</span>
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
