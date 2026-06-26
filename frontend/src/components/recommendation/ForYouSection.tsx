"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "next-auth/react";
import { useForYouRecommendations } from "@/hooks/useRecommendations";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07 },
  },
};

function ForYouSkeleton() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
        >
          <Skeleton className="h-44 w-full rounded-none" />
          <div className="p-4 space-y-2.5">
            <Skeleton className="h-4 w-4/5 rounded" />
            <Skeleton className="h-3 w-3/5 rounded" />
            <Skeleton className="h-3 w-1/3 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ForYouSection() {
  const shouldReduceMotion = useReducedMotion();
  const { data: session } = useSession();
  const { data, isLoading } = useForYouRecommendations(12);
  const listings = data?.data ?? [];

  const title = session ? "Gợi ý cho bạn" : "Tin đăng nổi bật";
  const subtitle = session
    ? "Dựa trên lịch sử tìm kiếm của bạn"
    : "Các phòng được quan tâm nhiều nhất tuần này";

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              {title}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          </div>
          <Link
            href="/app/search"
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors"
          >
            Xem tất cả
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoading ? (
          <ForYouSkeleton />
        ) : listings.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            Chưa có gợi ý nào. Hãy khám phá thêm nhiều phòng trọ!
          </div>
        ) : (
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
            variants={shouldReduceMotion ? {} : containerVariants}
            initial="hidden"
            animate="show"
          >
            {listings.map((listing) => (
              <motion.div
                key={listing.id}
                variants={shouldReduceMotion ? {} : cardVariants}
              >
                <Link
                  href={`/app/listings/${listing.id}`}
                  className="block bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:border-gray-300 transition-all"
                >
                  <div className="relative h-44 bg-gray-100">
                    <Image
                      src={
                        listing.thumbnail ||
                        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop"
                      }
                      alt={listing.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover"
                    />
                    <div className="absolute top-3 right-3 z-10 bg-white/95 px-2.5 py-1 rounded-full text-xs font-semibold text-blue-600">
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
                    {listing.areaM2 && (
                      <p className="text-sm text-gray-400">{listing.areaM2}m²</p>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
