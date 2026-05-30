"use client";

import Link from "next/link";
import { Search, MapPin, TrendingUp, Star, Loader2, Users, MessageCircle } from "lucide-react";
import { useListings } from "@/hooks/useListings";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

export default function HomePage() {
  const { data: apiResponse, isLoading } = useListings({ size: 6 });
  const featuredListings = apiResponse?.data?.content || [];
  const totalListings = apiResponse?.data?.page?.totalElements ?? apiResponse?.data?.totalElements ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Search Section */}
      <section className="bg-gradient-to-br from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Tìm phòng trọ lý tưởng của bạn
            </h1>
            <p className="text-xl text-blue-100">
              Hơn {totalListings > 0 ? totalListings : "--"} phòng trọ được xác thực tại Đà Nẵng
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Link
              href="/app/search"
              className="flex items-center gap-3 bg-white text-gray-900 rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <Search className="h-6 w-6 text-gray-400" />
              <span className="text-lg text-gray-500">
                Tìm theo khu vực, giá, loại phòng...
              </span>
            </Link>

            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {["Hải Châu", "Thanh Khê", "Sơn Trà", "Liên Chiểu"].map((district) => (
                <Link
                  key={district}
                  href={`/app/search?district=${district}`}
                  className="px-4 py-2 bg-white/20 rounded-full text-sm hover:bg-white/30 transition-colors"
                >
                  {district}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">{totalListings > 0 ? `${totalListings}+` : "--"}</div>
              <div className="text-gray-600 mt-1">Phòng trọ</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">98%</div>
              <div className="text-gray-600 mt-1">Đã xác thực</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">4.7★</div>
              <div className="text-gray-600 mt-1">Đánh giá TB</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600">24/7</div>
              <div className="text-gray-600 mt-1">Hỗ trợ</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Phòng trọ nổi bật</h2>
              <p className="text-gray-600 mt-2">Các phòng trọ được đánh giá cao nhất</p>
            </div>
            <Link
              href="/app/search"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
            >
              Xem tất cả
              <TrendingUp className="h-5 w-5" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                <div className="col-span-3 flex justify-center py-16">
                  <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                </div>
              ) : featuredListings.length === 0 ? (
                <div className="col-span-3 text-center py-16 text-gray-500">
                  Chưa có tin đăng nào. Hãy là người đầu tiên đăng tin!
                </div>
              ) : (
                featuredListings.map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/app/listings/${listing.id}`}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow block"
                  >
                    <div className="relative h-48 bg-gray-200">
                      <img
                        src={listing.images?.[0]?.imageUrl || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop"}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full text-sm font-semibold text-blue-600">
                        {formatPrice(listing.pricePerMonth)}/tháng
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-1 text-gray-900">
                        {listing.title}
                      </h3>

                      <div className="flex items-center gap-1 text-gray-600 text-sm mb-2">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="line-clamp-1">
                          {[listing.district, listing.city].filter(Boolean).join(", ")}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3 text-gray-600">
                          {listing.areaM2 && <span>{listing.areaM2}m²</span>}
                          {listing.numBedrooms != null && <span>• {listing.numBedrooms} PN</span>}
                        </div>
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Star className="h-4 w-4 fill-current shrink-0" />
                          <span className="font-semibold text-gray-900">4.8</span>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1">
                        {listing.hasWifi && <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">WiFi</span>}
                        {listing.hasParking && <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">Đỗ xe</span>}
                        {listing.hasAirConditioner && <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">Điều hòa</span>}
                      </div>
                    </div>
                  </Link>
                ))
              )}
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Tham gia cộng đồng RentSpace
            </h2>
            <p className="text-xl text-gray-600">
              Kết nối, chia sẻ và học hỏi từ hàng ngàn người dùng khác
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Tìm bạn ở ghép</h3>
              <p className="text-gray-600">
                Tìm người cùng phòng phù hợp với lối sống của bạn
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Review chân thực</h3>
              <p className="text-gray-600">
                Đọc đánh giá từ người đã ở, tránh lừa đảo
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Tips & Kinh nghiệm</h3>
              <p className="text-gray-600">
                Học hỏi từ kinh nghiệm của những người đi trước
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/app/community"
              className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Khám phá cộng đồng
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Bạn là chủ trọ?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Đăng tin miễn phí và tiếp cận hàng ngàn người tìm phòng mỗi ngày
          </p>
          <Link
            href="/app/landlord/create-listing"
            className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Đăng tin ngay
          </Link>
        </div>
      </section>
    </div>
  );
}
