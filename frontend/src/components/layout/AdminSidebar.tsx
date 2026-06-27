"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Shield,
  Home,
  User,
  Flag,
  AlertTriangle,
  CreditCard,
  Building2,
} from "lucide-react";

export function AdminSidebar() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path || (path !== "/app" && pathname?.startsWith(path));

  const menuItems = [
    { path: "/app/admin", icon: LayoutDashboard, label: "Dashboard quản trị" },
    { path: "/app/admin/kyc", icon: Shield, label: "Duyệt KYC" },
    { path: "/app/admin/listings", icon: Building2, label: "Quản lý tin đăng" },
    { path: "/app/admin/users", icon: User, label: "Quản lý thành viên" },
    { path: "/app/admin/reports", icon: Flag, label: "Xử lý báo cáo" },
    { path: "/app/admin/disputes", icon: AlertTriangle, label: "Tranh chấp cọc" },
    { path: "/app/admin/payouts", icon: CreditCard, label: "Đối soát giải ngân" },
    { path: "/app", icon: Home, label: "Quay lại trang chính" },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-76px)] hidden md:block shrink-0">
      <div className="p-6">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
          Hệ thống quản trị
        </h2>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? "bg-blue-50 text-blue-600 font-bold"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon className={`h-5 w-5 ${active ? "text-blue-600" : "text-gray-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
