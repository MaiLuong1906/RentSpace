import Link from "next/link";
import { Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8 bg-white/80 backdrop-blur-md p-8 sm:p-10 rounded-2xl shadow-xl border border-gray-100 animate-in fade-in duration-300">
        
        {/* Animated Icon & 404 Text */}
        <div className="relative flex justify-center">
          <div className="absolute inset-0 bg-blue-400/10 blur-3xl rounded-full w-40 h-40 mx-auto"></div>
          <div className="relative">
            <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 select-none animate-pulse">
              404
            </h1>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-gray-900">
            Không tìm thấy trang
          </h2>
          <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
            Đường liên kết bạn vừa truy cập có thể bị hỏng, đã bị gỡ bỏ hoặc trang đang được bảo trì.
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link
            href="/app"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 active:scale-98 transition-all shadow-md shadow-blue-500/10"
          >
            <Home className="h-4 w-4" />
            Trang chủ
          </Link>

          <Link
            href="/app/search"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 font-semibold text-sm active:scale-98 transition-all"
          >
            <Search className="h-4 w-4" />
            Tìm phòng
          </Link>
        </div>

        {/* Footer link */}
        <div className="pt-4 border-t border-gray-100">
          <Link
            href="javascript:history.back()"
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 font-medium transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Quay lại trang trước
          </Link>
        </div>
      </div>
    </div>
  );
}
