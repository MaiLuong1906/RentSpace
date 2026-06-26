"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useSimilarListings } from "@/hooks/useRecommendations";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

function SimilarListingsSkeleton() {
  return (
    <section className="mt-8 pt-8 border-t border-gray-100">
      <Skeleton className="w-36 h-6 mb-6 rounded-lg" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
          >
            <Skeleton className="h-36 w-full rounded-none" />
            <div className="p-3 space-y-2">
              <Skeleton className="h-4 w-4/5 rounded" />
              <Skeleton className="h-3 w-3/5 rounded" />
              <Skeleton className="h-3 w-2/5 rounded" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SimilarListings({ listingId }: { listingId: number }) {
  const shouldReduceMotion = useReducedMotion();
  const { data, isLoading } = useSimilarListings(listingId);
  const listings = data?.data ?? [];

  if (isLoading) return <SimilarListingsSkeleton />;
  if (!listings.length) return null;

  return (
    <section className="mt-8 pt-8 border-t border-gray-100">
      <h2 className="text-xl font-bold tracking-tight text-gray-900 mb-6">
        Phòng tương tự
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {listings.map((listing, i) => (
          <motion.div
            key={listing.id}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.35,
              delay: i * 0.07,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <Link
              href={`/app/listings/${listing.id}`}
              className="block bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all"
            >
              <div className="relative h-36 bg-gray-100">
                <Image
                  src={
                    listing.thumbnail ||
                    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop"
                  }
                  alt={listing.title}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover"
                />
                <div className="absolute top-2 right-2 z-10 bg-white/95 px-2 py-0.5 rounded-full text-xs font-semibold text-blue-600">
                  {formatPrice(listing.pricePerMonth)}/tháng
                </div>
              </div>

              <div className="p-3">
                <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 mb-1">
                  {listing.title}
                </h3>
                <div className="flex items-center gap-1 text-gray-500 text-xs">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="line-clamp-1">
                    {[listing.district, listing.city].filter(Boolean).join(", ")}
                  </span>
                </div>
                {listing.areaM2 && (
                  <p className="text-xs text-gray-400 mt-1">{listing.areaM2}m²</p>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
