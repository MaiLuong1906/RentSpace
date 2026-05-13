import Link from "next/link";
import { Search, Shield, Users, MapPin, Star, MessageCircle } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Tìm phòng trọ an toàn,<br />
              kết nối cộng đồng
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Nền tảng cho thuê phòng trọ đầu tiên tại Việt Nam tích hợp mạng xã hội,
              KYC xác thực danh tính và review chân thực
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Đăng ký ngay
              </Link>
              <Link
                href="/auth/login"
                className="px-8 py-4 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 border-2 border-white transition-colors"
              >
                Đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
            Tại sao chọn RentSpace?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Xác thực danh tính KYC</h3>
              <p className="text-gray-600">
                Mọi người dùng đều phải xác thực CCCD, đảm bảo an toàn và minh bạch
              </p>
            </div>

            <div className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Review chân thực</h3>
              <p className="text-gray-600">
                Chỉ người đã ở mới được đánh giá, không còn lo lừa đảo
              </p>
            </div>

            <div className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Tìm bạn ở ghép</h3>
              <p className="text-gray-600">
                Kết nối với người ở ghép phù hợp qua cộng đồng có kiểm chứng
              </p>
            </div>

            <div className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Bản đồ tìm kiếm</h3>
              <p className="text-gray-600">
                Tìm phòng trực quan theo vị trí địa lý, tiết kiệm thời gian
              </p>
            </div>

            <div className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <MessageCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Chat realtime</h3>
              <p className="text-gray-600">
                Nhắn tin trực tiếp với chủ trọ, giải đáp thắc mắc ngay lập tức
              </p>
            </div>

            <div className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Tìm kiếm thông minh</h3>
              <p className="text-gray-600">
                Lọc theo giá, khu vực, tiện nghi và nhiều tiêu chí khác
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Sẵn sàng tìm phòng trọ lý tưởng?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Tham gia cộng đồng RentSpace ngay hôm nay
          </p>
          <Link
            href="/auth/register"
            className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Bắt đầu miễn phí
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-4">RentSpace</h3>
              <p className="text-sm">
                Nền tảng cho thuê phòng trọ an toàn & minh bạch
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Sản phẩm</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/app/search" className="hover:text-white">Tìm phòng</Link></li>
                <li><Link href="/auth/register" className="hover:text-white">Đăng tin</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Hỗ trợ</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Trung tâm trợ giúp</a></li>
                <li><a href="#" className="hover:text-white">Liên hệ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Pháp lý</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Điều khoản</a></li>
                <li><a href="#" className="hover:text-white">Bảo mật</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
            © 2026 RentSpace. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
