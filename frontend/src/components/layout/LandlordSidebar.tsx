"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  BarChart3,
  ShieldCheck,
  Zap,
  CreditCard,
  User,
} from "lucide-react";

export function LandlordSidebar() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path || (path !== "/app" && pathname?.startsWith(path));

  const menuItems = [
    { path: "/app/landlord/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/app/landlord/my-listings", icon: Building2, label: "Quản lý phòng" },
    { path: "/app/landlord/analytics", icon: BarChart3, label: "Thống kê doanh thu" },
    { path: "/app/deposits", icon: ShieldCheck, label: "Lịch sử đặt cọc" },
    { path: "/app/landlord/subscription", icon: Zap, label: "Gói hội viên" },
    { path: "/app/landlord/payout", icon: CreditCard, label: "Yêu cầu giải ngân" },
    { path: "/app/profile", icon: User, label: "Hồ sơ cá nhân" },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-76px)] hidden md:block shrink-0">
      <div className="p-6">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
          Nghiệp vụ chủ nhà
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
