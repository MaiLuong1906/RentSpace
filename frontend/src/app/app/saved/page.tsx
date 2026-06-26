"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, MapPin, Star, Loader2, Search, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSavedListings } from "@/hooks/useSavedListings";
import { SaveButton } from "@/components/listing/SaveButton";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

const ROOM_TYPE_LABELS: Record<string, string> = {
  PHONG_TRO: "Phòng trọ",
  NGAN_GIAN: "Phòng ngăn gian",
  CHUNG_CU: "Chung cư",
  CHUNG_CU_MINI: "Chung cư mini",
  NHA_NGUYEN_CAN: "Nhà nguyên căn",
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.2 } },
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

export default function SavedListingsPage() {
  const [page, setPage] = useState(0);
  const { data, isLoading, isError } = useSavedListings({ page, size: 12 });

  const listings = data?.data?.content ?? [];
  // Hỗ trợ cả 2 format Spring Page: top-level (default) và nested page object (VIA_DTO)
  const totalPages = data?.data?.totalPages ?? data?.data?.page?.totalPages ?? 0;
  const totalElements = data?.data?.totalElements ?? data?.data?.page?.totalElements ?? 0;

  return (
    <div className="min-h-[100dvh] bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/app/search"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại tìm kiếm
          </Link>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 rounded-xl border border-red-100">
              <Heart className="h-5 w-5 fill-red-500 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tin đã lưu</h1>
              {!isLoading && totalElements > 0 && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {totalElements} phòng đang lưu
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-3" />
            <p className="text-sm text-gray-500 font-medium">Đang tải danh sách...</p>
          </div>
        )}

        {/* Error */}
        {isError && !isLoading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-gray-500 mb-2">Không thể tải danh sách yêu thích.</p>
            <button
              onClick={() => window.location.reload()}
              className="text-blue-600 text-sm font-semibold hover:underline"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && listings.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-5">
              <Heart className="h-9 w-9 text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Chưa có tin nào được lưu
            </h2>
            <p className="text-gray-500 text-sm max-w-xs mb-6">
              Nhấn vào biểu tượng trái tim trên các phòng trọ để lưu vào danh sách yêu thích
            </p>
            <Link
              href="/app/search"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Search className="h-4 w-4" />
              Khám phá phòng trọ
            </Link>
          </motion.div>
        )}

        {/* Listings grid */}
        {!isLoading && listings.length > 0 && (
          <>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            >
              <AnimatePresence mode="popLayout">
                {listings.map((listing) => {
                  const imageUrl =
                    listing.images?.[0]?.imageUrl ??
                    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop";

                  return (
                    <motion.div
                      key={listing.id}
                      variants={cardVariants}
                      layout
                      className="relative bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col"
                    >
                      {/* Image */}
                      <Link href={`/app/listings/${listing.id}`} className="relative block h-44 bg-gray-200 overflow-hidden">
                        <img
                          src={imageUrl}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                        {/* Price badge */}
                        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-blue-600 shadow-sm border border-gray-100">
                          {formatPrice(listing.pricePerMonth)}/tháng
                        </div>
                      </Link>

                      {/* Save button overlay */}
                      <div className="absolute top-3 right-3 z-10">
                        <SaveButton
                          listingId={listing.id}
                          initialSaved={true}
                          size="sm"
                        />
                      </div>

                      {/* Content */}
                      <Link href={`/app/listings/${listing.id}`} className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-1.5 leading-snug">
                            {listing.title}
                          </h3>
                          <div className="flex items-center gap-1 text-gray-400 text-xs">
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="line-clamp-1">
                              {[listing.district, listing.city].filter(Boolean).join(", ")}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                          <span className="text-xs text-gray-500 font-medium">
                            {listing.areaM2 ? `${listing.areaM2} m²` : ""}
                            {listing.areaM2 && listing.roomType ? " • " : ""}
                            {ROOM_TYPE_LABELS[listing.roomType] ?? listing.roomType}
                          </span>
                          {(listing.averageRating ?? 0) > 0 && (
                            <div className="flex items-center gap-1 text-yellow-500">
                              <Star className="h-3.5 w-3.5 fill-yellow-500" />
                              <span className="text-xs font-bold text-gray-800">
                                {listing.averageRating!.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Trước
                </button>
                <span className="text-sm text-gray-500 font-medium px-2">
                  Trang {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
