"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Home,
  Search,
  MessageSquare,
  User,
  LogOut,
  Menu,
  X,
  PlusCircle,
  Building2,
  Shield,
  Users,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const rawRole = session?.user?.role;
  const userRole = (rawRole?.toLowerCase() || "tenant") as "tenant" | "landlord" | "admin";

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string) => pathname?.startsWith(path);

  const handleLogout = async () => {
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
      if (session?.accessToken) {
        await fetch(`${apiBaseUrl}/auth/logout`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.accessToken}`,
          },
        });
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
    { path: "/app/community", icon: Users, label: "Cộng đồng", roles: ["tenant", "landlord", "admin"], exact: false },
    { path: "/app/messages", icon: MessageSquare, label: "Tin nhắn", roles: ["tenant", "landlord", "admin"], exact: false },
  ];

  const landlordItems = [
    { path: "/app/landlord/create-listing", icon: PlusCircle, label: "Đăng tin" },
    { path: "/app/landlord/my-listings", icon: Building2, label: "Quản lý phòng" },
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
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/app" className="flex items-center gap-2 text-blue-600">
                <Home className="h-6 w-6" />
                <span className="text-xl font-semibold">RentSpace</span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex gap-6">
                {navItems
                  .filter((item) => item.roles.includes(userRole))
                  .map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                        isItemActive(item.path, item.exact || false)
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  ))}

                {userRole === "landlord" && (
                  <>
                    {landlordItems.map((item) => (
                      <Link
                        key={item.path}
                        href={item.path}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
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
                    {adminItems.map((item) => (
                      <Link
                        key={item.path}
                        href={item.path}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
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
              </nav>
            </div>

            <div className="flex items-center gap-4">
              {/* User Menu */}
              <div className="hidden md:flex items-center gap-3">
                {status === "authenticated" ? (
                  <>
                    <Link
                      href="/app/profile"
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl hover:bg-gray-50 text-gray-700 font-bold text-sm transition-all"
                    >
                      <User className="h-4.5 w-4.5 text-gray-500" />
                      <span>Hồ sơ</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl hover:bg-gray-50 text-red-600 font-bold text-sm transition-all active:scale-95"
                    >
                      <LogOut className="h-4.5 w-4.5" />
                      <span>Đăng xuất</span>
                    </button>
                  </>
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

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100"
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
          <div className="md:hidden border-t border-gray-200 bg-white">
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
                    <item.icon className="h-5 w-5" />
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
