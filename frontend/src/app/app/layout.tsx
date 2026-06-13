"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Home,
  Search,
  MessageSquare,
  User,
  LogOut,
  Menu,
  X,
  Building2,
  Shield,
  Users,
  Sparkles,
  BarChart3,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { authApi } from "@/lib/api/auth.api";
import { useChat } from "@/hooks/useChat";
import { useChatStore } from "@/store/chatStore";
import { NotificationDropdown } from "@/components/notification";

const getShortName = (fullName?: string | null, email?: string | null) => {
  if (!fullName) {
    return email ? email.split("@")[0] : "Thành viên";
  }
  // Loại bỏ các phần chú thích trong ngoặc đơn ở cuối tên (ví dụ: "(VP)", "(Tenant)")
  const cleanName = fullName.replace(/\s*\([^)]*\)\s*$/, "");
  const parts = cleanName.trim().split(/\s+/);
  return parts[parts.length - 1];
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  useChat(); // Kích hoạt kết nối WebSocket STOMP toàn cục khi người dùng đăng nhập
  const totalUnread = useChatStore((state) => state.totalUnread);

  const rawRole = session?.user?.role;
  const userRole = (rawRole?.toLowerCase() || "tenant") as "tenant" | "landlord" | "admin";

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const pathname = usePathname();

  // Đóng dropdown khi chuyển trang
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsUserMenuOpen(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("#user-dropdown-trigger") && !target.closest("#user-dropdown-menu")) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Tự động đăng xuất nếu Refresh Token hết hạn hoặc không hợp lệ (Silent Session Expiration)
  useEffect(() => {
    if ((session as { error?: string })?.error === "RefreshAccessTokenError") {
      signOut({ callbackUrl: "/auth/login" });
    }
  }, [session]);

  // Reset active conversation khi rời khỏi các trang chat (messages / chat)
  useEffect(() => {
    if (pathname && !pathname.startsWith("/app/messages") && !pathname.startsWith("/app/chat")) {
      useChatStore.getState().setActiveConversation(null);
    }
  }, [pathname]);

  const isActive = (path: string) => pathname?.startsWith(path);

  const handleLogout = async () => {
    try {
      if (session?.accessToken) {
        await authApi.logout();
      }
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      signOut({ callbackUrl: "/auth/login" });
    }
  };

  const navItems = [
    { path: "/app", icon: Home, label: "Trang chủ", roles: ["tenant", "landlord", "admin"], exact: true },
    { path: "/app/search", icon: Search, label: "Tìm phòng", roles: ["tenant", "landlord", "admin"], exact: false },
    { path: "/app/roommates", icon: Sparkles, label: "Ở ghép", roles: ["tenant", "landlord", "admin"], exact: false },
    { path: "/app/community", icon: Users, label: "Cộng đồng", roles: ["tenant", "landlord", "admin"], exact: false },
    { path: "/app/messages", icon: MessageSquare, label: "Tin nhắn", roles: ["tenant", "landlord", "admin"], exact: false },
  ];

  const landlordItems = [
    { path: "/app/landlord/my-listings", icon: Building2, label: "Quản lý phòng" },
    { path: "/app/landlord/analytics", icon: BarChart3, label: "Thống kê" },
  ];

  const adminItems = [
    { path: "/app/admin", icon: Shield, label: "Admin Dashboard" },
  ];

  const isItemActive = (itemPath: string, exact: boolean) => {
    if (exact) return pathname === itemPath;
    return pathname?.startsWith(itemPath) && pathname !== "/app";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-[76px] justify-between">
            {/* Logo — bên trái */}
            <Link href="/app" className="flex items-center gap-2.5 text-blue-600 shrink-0">
              <Home className="h-6 w-6" />
              <span className="text-[18px] font-bold hidden xl:block">RentSpace</span>
            </Link>

            {/* Desktop Navigation — dàn đều ra giữa */}
            <nav className="hidden lg:flex flex-1 items-center justify-center gap-1.5 px-4">
              {navItems
                .filter((item) => item.roles.includes(userRole))
                .map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors text-[16px] font-medium whitespace-nowrap ${
                      isItemActive(item.path, item.exact || false)
                        ? "bg-blue-50 text-blue-600 font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div className="relative">
                      <item.icon className="h-5 w-5 shrink-0" />
                      {item.path === "/app/messages" && totalUnread > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm">
                          {totalUnread}
                        </span>
                      )}
                    </div>
                    <span>{item.label}</span>
                  </Link>
                ))}

              {userRole === "landlord" && (
                <>
                  <div className="h-6 w-px bg-gray-200 mx-1.5" />
                  {landlordItems.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors text-[16px] font-medium whitespace-nowrap ${
                        isActive(item.path)
                          ? "bg-blue-50 text-blue-600 font-semibold"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </>
              )}

              {userRole === "admin" && (
                <>
                  <div className="h-6 w-px bg-gray-200 mx-1.5" />
                  {adminItems.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors text-[16px] font-medium whitespace-nowrap ${
                        isActive(item.path)
                          ? "bg-blue-50 text-blue-600 font-semibold"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </>
              )}
            </nav>

            {/* User Actions — luôn bên phải */}
            <div className="flex items-center gap-2 ml-auto shrink-0">
              <div className="hidden lg:flex items-center gap-1.5">
                {status === "authenticated" ? (
                  <div className="flex items-center gap-3">
                    <NotificationDropdown />
                    
                    {/* User Dropdown Container */}
                    <div className="relative">
                      <button
                        id="user-dropdown-trigger"
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl hover:bg-gray-105 border border-gray-100 transition-all active:scale-[0.98] cursor-pointer text-gray-700 ${
                          isUserMenuOpen ? "bg-gray-50 border-gray-200 shadow-sm" : "bg-white"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-100 uppercase">
                          {getShortName(session?.user?.fullName, session?.user?.email).charAt(0)}
                        </div>
                        <div className="text-left hidden xl:block">
                          <p className="text-sm font-bold text-gray-800 line-clamp-1 max-w-[120px]">
                            {getShortName(session?.user?.fullName, session?.user?.email)}
                          </p>
                          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                            {userRole === "admin" ? "Quản trị" : userRole === "landlord" ? "Chủ nhà" : "Người thuê"}
                          </p>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isUserMenuOpen ? "rotate-180" : ""}`} />
                      </button>

                      {/* Dropdown Menu */}
                      {isUserMenuOpen && (
                        <div
                          id="user-dropdown-menu"
                          className="absolute right-0 mt-2.5 w-60 bg-white border border-gray-150 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                        >
                          {/* User Info Header */}
                          <div className="px-4.5 py-2.5 border-b border-gray-100">
                            <p className="text-sm font-bold text-gray-950 truncate">{session?.user?.fullName || "Thành viên"}</p>
                            <p className="text-xs text-gray-400 truncate mt-0.5">{session?.user?.email}</p>
                          </div>

                          {/* Menu Items */}
                          <div className="p-1 space-y-0.5">
                            <Link
                              href="/app/profile"
                              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-semibold transition-colors ${
                                isActive("/app/profile") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              <User className="h-4.5 w-4.5 text-gray-400" />
                              <span>Hồ sơ cá nhân</span>
                            </Link>

                            <Link
                              href="/app/deposits"
                              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-semibold transition-colors ${
                                isActive("/app/deposits") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              <ShieldCheck className="h-4.5 w-4.5 text-gray-400" />
                              <span>Lịch sử đặt cọc</span>
                            </Link>
                          </div>

                          <div className="border-t border-gray-100 my-1" />

                          {/* Logout Button */}
                          <div className="p-1">
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
                            >
                              <LogOut className="h-4.5 w-4.5" />
                              <span>Đăng xuất</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : status === "unauthenticated" ? (
                  <>
                    <Link
                      href="/auth/login"
                      className="px-4 py-2 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
                    >
                      Đăng nhập
                    </Link>
                    <Link
                      href="/auth/register"
                      className="px-4 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-md shadow-blue-500/10 active:scale-95"
                    >
                      Đăng ký
                    </Link>
                  </>
                ) : (
                  <div className="h-8 w-24 bg-gray-100 animate-pulse rounded-xl" />
                )}
              </div>

              {/* Mobile notification bell */}
              {status === "authenticated" && (
                <div className="lg:hidden flex items-center mr-1">
                  <NotificationDropdown />
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <nav className="px-4 py-4 space-y-2">
              {navItems
                .filter((item) => item.roles.includes(userRole))
                .map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                      isItemActive(item.path, item.exact || false)
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div className="relative">
                      <item.icon className="h-5 w-5" />
                      {item.path === "/app/messages" && totalUnread > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm">
                          {totalUnread}
                        </span>
                      )}
                    </div>
                    <span>{item.label}</span>
                  </Link>
                ))}

              {userRole === "landlord" && (
                <>
                  <div className="h-px bg-gray-200 my-2" />
                  {landlordItems.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                        isActive(item.path)
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </>
              )}

              {userRole === "admin" && (
                <>
                  <div className="h-px bg-gray-200 my-2" />
                  {adminItems.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                        isActive(item.path)
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </>
              )}

              <div className="h-px bg-gray-200 my-2" />
              {status === "authenticated" ? (
                <>
                  <Link
                    href="/app/deposits"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                      isActive("/app/deposits") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <ShieldCheck className="h-5 w-5" />
                    <span>Đặt cọc của tôi</span>
                  </Link>
                  <Link
                    href="/app/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-all"
                  >
                    <User className="h-5 w-5 text-gray-500" />
                    <span>Hồ sơ</span>
                  </Link>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-gray-50 font-semibold text-sm transition-all text-left"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Đăng xuất</span>
                  </button>
                </>
              ) : status === "unauthenticated" ? (
                <div className="grid grid-cols-2 gap-3 px-4 py-2">
                  <Link
                    href="/auth/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex justify-center items-center py-2.5 rounded-xl text-sm font-bold text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex justify-center items-center py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-md shadow-blue-500/10 active:scale-95"
                  >
                    Đăng ký
                  </Link>
                </div>
              ) : null}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  );
}
