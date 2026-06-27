"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { VerificationBanner } from "@/components/trust/VerificationBanner";
import { verificationApi } from "@/lib/api/verification.api";
import { listingApi } from "@/lib/api/listing.api";
import {
  Users,
  MessageCircle,
  TrendingUp,
  ArrowRight,
  MapPin,
  Sparkles,
} from "lucide-react";
import { ForYouSection } from "@/components/recommendation/ForYouSection";
import { Skeleton } from "@/components/ui/skeleton";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

function FeaturedSkeleton() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <Skeleton className="h-44 w-full rounded-none" />
          <div className="p-4 space-y-2">
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
            <Skeleton className="h-3 w-1/4 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const { data: session } = useSession();

  // Chỉ gọi KYC status khi đã đăng nhập
  const { data: verifyData } = useQuery({
    queryKey: ["verification-status"],
    queryFn: verificationApi.getStatus,
    retry: false,
    enabled: !!session?.user,
  });
  
  const verificationStatus = verifyData?.data?.status ?? "NOT_STARTED";
  const isVerified = verificationStatus === "VERIFIED";

  // Lấy các tin đăng nổi bật được boost (hệ thống tự động ưu tiên tin promoted lên đầu)
  const { data: featuredResponse, isLoading: isFeaturedLoading } = useQuery({
    queryKey: ["featured-listings"],
    queryFn: () => listingApi.getListings({ size: 6 }),
  });
  
  const featuredListings = featuredResponse?.data?.content || [];

  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA] pb-12">
      {session?.user && (
        <VerificationBanner isVerified={isVerified} verificationStatus={verificationStatus} />
      )}

      {/* ── Featured Listings Section ── */}
      <section className="py-12 md:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-600 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 fill-amber-500 text-amber-500 animate-pulse" />
              Ưu tiên hiển thị
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 mt-1">
              Tin nổi bật dành cho bạn
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Các phòng trọ nổi bật từ các chủ nhà uy tín
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

        {isFeaturedLoading ? (
          <FeaturedSkeleton />
        ) : featuredListings.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm bg-white border rounded-2xl">
            Chưa có tin nổi bật nào được đăng.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredListings.map((listing) => (
              <Link
                key={listing.id}
                href={`/app/listings/${listing.id}`}
                className="group block bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all duration-300 relative"
              >
                {listing.isPromoted && (
                  <span className="absolute top-3 left-3 z-10 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-sm border border-amber-400">
                    ✨ NỔI BẬT
                  </span>
                )}
                <div className="relative h-44 bg-gray-100 overflow-hidden">
                  <Image
                    src={
                      listing.images?.[0]?.imageUrl ||
                      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop"
                    }
                    alt={listing.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    unoptimized
                  />
                  <div className="absolute top-3 right-3 z-10 bg-white/95 px-2.5 py-1 rounded-full text-xs font-bold text-blue-600 shadow-sm">
                    {formatPrice(listing.pricePerMonth)}/tháng
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1.5 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {listing.title}
                  </h3>
                  <div className="flex items-center gap-1 text-gray-500 text-xs">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    <span className="truncate">{listing.district}, Đà Nẵng</span>
                    <span className="mx-1">•</span>
                    <span>{listing.areaM2}m²</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── For You Section (AI Recommendation) ── */}
      {session?.user && <ForYouSection />}

      {/* ── Community Section ── */}
      <section className="py-12 md:py-16 bg-white border-t border-b border-gray-100">
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

      {/* ── CTA Landlord Section ── */}
      <section className="py-12 mt-4">
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
