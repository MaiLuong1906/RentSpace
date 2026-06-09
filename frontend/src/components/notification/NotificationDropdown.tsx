"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, Loader2, Info, UserCheck, ShieldAlert, Key } from "lucide-react";
import { useNotificationStore } from "@/store/notificationStore";
import { useRouter } from "next/navigation";

export function NotificationDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (id: number, type: string) => {
    await markAsRead(id);
    setIsOpen(false);

    // Redirect user depending on notification type
    if (type === "KYC") {
      router.push("/app/kyc");
    } else if (type === "REPORT") {
      router.push("/app/admin/reports");
    } else if (type === "RENTAL") {
      router.push("/app/landlord/listings");
    } else {
      router.push("/app");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "KYC":
        return <UserCheck className="h-4 w-4 text-green-500" />;
      case "REPORT":
        return <ShieldAlert className="h-4 w-4 text-red-500" />;
      case "SECURITY":
        return <Key className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return "Vừa xong";
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays < 7) return `${diffDays} ngày trước`;
      
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-full hover:bg-gray-100 transition-all focus:outline-none ${
          isOpen ? "bg-gray-100 text-blue-600" : "text-gray-600"
        }`}
        title="Thông báo"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white shadow-sm">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="font-bold text-gray-900 text-base">Thông báo</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Đọc tất cả
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
            {isLoading ? (
              <div className="p-8 text-center flex flex-col items-center justify-center text-gray-500 gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="text-xs">Đang tải thông báo...</span>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n.id, n.type)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors flex gap-3 items-start border-l-2 ${
                    n.isRead ? "border-transparent bg-white" : "border-blue-600 bg-blue-50/20"
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${
                    n.isRead ? "bg-gray-100 text-gray-500" : "bg-blue-100/50 text-blue-600"
                  }`}>
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm truncate ${n.isRead ? "font-medium text-gray-700" : "font-bold text-gray-900"}`}>
                        {n.title}
                      </span>
                      <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                        {formatTime(n.createdAt)}
                      </span>
                    </div>
                    <p className={`text-xs leading-relaxed ${n.isRead ? "text-gray-500" : "text-gray-700 font-medium"}`}>
                      {n.content}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-10 text-center text-sm text-gray-400">
                Không có thông báo mới nào
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
