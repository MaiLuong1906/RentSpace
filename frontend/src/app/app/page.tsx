"use client";

import Link from "next/link";
import Image from "next/image";
import { VerifiedBadge } from "@/components/trust/VerifiedBadge";
import {
  Search,
  MapPin,
  Star,
  Loader2,
  Users,
  MessageCircle,
  TrendingUp,
  ArrowRight,
  Zap,
} from "lucide-react";
import { useListings } from "@/hooks/useListings";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

const DISTRICTS = ["Hải Châu", "Thanh Khê", "Sơn Trà", "Liên Chiểu"];

export default function HomePage() {
  const { data: apiResponse, isLoading } = useListings({ size: 6 });
  const featuredListings = apiResponse?.data?.content || [];
  const totalListings =
    apiResponse?.data?.page?.totalElements ??
    apiResponse?.data?.totalElements ??
    0;

  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA]">
      {/* ── Hero Search ── */}
      <section className="bg-white border-b border-gray-100 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-600">
              Nền tảng tin cậy
            </span>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-gray-900 mt-3 mb-3">
              Tìm phòng trọ lý tưởng của bạn
            </h1>
            <p className="text-base text-gray-500">
              Hơn{" "}
              <span className="font-semibold text-gray-700">
                {totalListings > 0 ? totalListings : "--"}
              </span>{" "}
              phòng trọ được xác thực tại Đà Nẵng
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <Link
              href="/app/search"
              className="flex items-center gap-3 bg-white border border-gray-200 text-gray-900 rounded-xl p-4 hover:border-blue-300 hover:shadow-[0_4px_16px_rgba(37,99,235,0.08)] transition-all"
            >
              <Search className="h-5 w-5 text-gray-400 shrink-0" />
              <span className="text-gray-400">
                Tìm theo khu vực, giá, loại phòng...
              </span>
            </Link>

            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {DISTRICTS.map((d) => (
                <Link
                  key={d}
                  href={`/app/search?district=${d}`}
                  className="px-4 py-1.5 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-600 text-sm rounded-full transition-colors"
                >
                  {d}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-white border-b border-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              {
                value: totalListings > 0 ? `${totalListings}+` : "12+",
                label: "Phòng trọ",
              },
              { value: "98%", label: "Đã xác thực" },
              { value: "4.7★", label: "Đánh giá TB" },
              { value: "24/7", label: "Hỗ trợ" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                <div className="text-sm text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Listings ── */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                Phòng trọ nổi bật
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Các phòng trọ được đánh giá cao nhất
              </p>
            </div>
            <Link
              href="/app/search"
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors"
            >
              Xem tất cả
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {isLoading ? (
              <div className="col-span-3 flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : featuredListings.length === 0 ? (
              <div className="col-span-3 text-center py-16 text-gray-400 text-sm">
                Chưa có tin đăng nào. Hãy là người đầu tiên đăng tin!
              </div>
            ) : (
              featuredListings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/app/listings/${listing.id}`}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:border-gray-300 transition-all block"
                >
                  <div className="relative h-44 bg-gray-100">
                    {listing.isPromoted && (
                      <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-amber-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold">
                        <Zap className="h-3 w-3" />
                        Nổi bật
                      </div>
                    )}
                    <Image
                      src={
                        listing.images?.[0]?.imageUrl ||
                        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop"
                      }
                      alt={listing.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover"
                    />
                    <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-semibold text-blue-600">
                      {formatPrice(listing.pricePerMonth)}/tháng
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1.5 line-clamp-1">
                      {listing.title}
                    </h3>

                    <div className="flex items-center gap-1 text-gray-500 text-sm mb-2">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="line-clamp-1">
                        {[listing.district, listing.city]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-500">
                        {listing.areaM2 && <span>{listing.areaM2}m²</span>}
                        {listing.numBedrooms != null && (
                          <span>· {listing.numBedrooms} PN</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
                        <span className="text-xs font-semibold text-gray-700">
                          {listing.averageRating != null &&
                          listing.averageRating > 0
                            ? listing.averageRating.toFixed(1)
                            : "Chưa có"}
                        </span>
                      </div>
                    </div>

                    {(listing.hasWifi ||
                      listing.hasParking ||
                      listing.hasAirConditioner) && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {listing.hasWifi && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                            WiFi
                          </span>
                        )}
                        {listing.hasParking && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                            Đỗ xe
                          </span>
                        )}
                        {listing.hasAirConditioner && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                            Điều hòa
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── Community ── */}
      <section className="py-12 md:py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">
              Tham gia cộng đồng RentSpace
            </h2>
            <p className="text-sm text-gray-500">
              Kết nối, chia sẻ và học hỏi từ hàng ngàn người dùng khác
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 mb-8">
            {[
              {
                icon: <Users className="h-6 w-6 text-blue-600" />,
                title: "Tìm bạn ở ghép",
                desc: "Tìm người cùng phòng phù hợp với lối sống của bạn",
                href: "/app/roommates",
              },
              {
                icon: <TrendingUp className="h-6 w-6 text-blue-600" />,
                title: "Review chân thực",
                desc: "Đọc đánh giá từ người đã ở, tránh lừa đảo",
                href: "/app/community",
              },
              {
                icon: <MessageCircle className="h-6 w-6 text-blue-600" />,
                title: "Tips & Kinh nghiệm",
                desc: "Học hỏi từ kinh nghiệm của những người đi trước",
                href: "/app/community",
              },
            ].map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group flex flex-col gap-3 bg-[#FAFAFA] border border-gray-200 rounded-2xl p-6 hover:border-blue-200 hover:bg-blue-50/50 transition-all"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/app/community"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Khám phá cộng đồng
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA landlord ── */}
      <section className="py-12 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">
            Bạn là chủ trọ?
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Đăng tin miễn phí và tiếp cận hàng ngàn người tìm phòng mỗi ngày
          </p>
          <Link
            href="/app/landlord/create-listing"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Đăng tin ngay
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
