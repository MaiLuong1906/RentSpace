"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Star,
  Share2,
  Heart,
  MessageCircle,
  Phone,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import {
  getListingById,
  getReviewsByListingId,
  formatPrice,
  formatDate,
  getRoomTypeLabel,
} from "@/lib/mockData";

export default function ListingDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const listing = getListingById(id);
  const reviews = getReviewsByListingId(id);

  const [selectedImage, setSelectedImage] = useState(0);
  const [showContactModal, setShowContactModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Không tìm thấy phòng trọ
          </h2>
          <p className="text-gray-600 mb-4">
            Phòng trọ này có thể đã bị xóa hoặc không tồn tại
          </p>
          <Link href="/app/search" className="text-blue-600 hover:text-blue-700 font-semibold">
            ← Quay lại tìm kiếm
          </Link>
        </div>
      </div>
    );
  }

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : listing.rating;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Button */}
        <Link
          href="/app/search"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Quay lại tìm kiếm</span>
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="relative h-96 bg-gray-200">
                <img
                  src={listing.images[selectedImage]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
                {listing.landlordVerified && (
                  <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Đã xác thực KYC
                  </div>
                )}
                <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm">
                  {selectedImage + 1} / {listing.images.length}
                </div>
              </div>

              {listing.images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {listing.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-24 h-20 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === index
                          ? "border-blue-600"
                          : "border-transparent hover:border-gray-300"
                        }`}
                    >
                      <img
                        src={image}
                        alt={`${listing.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Listing Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {listing.title}
                  </h1>
                  <div className="flex items-center gap-4 text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-5 w-5" />
                      <span>{listing.address}, {listing.district}, {listing.city}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setIsSaved(!isSaved)}
                    className={`p-3 rounded-lg border-2 transition-colors ${isSaved
                        ? "border-red-600 bg-red-50 text-red-600"
                        : "border-gray-300 hover:border-gray-400"
                      }`}
                  >
                    <Heart className={`h-5 w-5 ${isSaved ? "fill-current" : ""}`} />
                  </button>
                  <button className="p-3 rounded-lg border-2 border-gray-300 hover:border-gray-400">
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-6 py-4 border-y border-gray-200">
                <div>
                  <div className="text-3xl font-bold text-blue-600">
                    {formatPrice(listing.price)}
                  </div>
                  <div className="text-sm text-gray-600">/ tháng</div>
                </div>

                <div className="h-12 w-px bg-gray-200" />

                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-xl font-semibold">{listing.area}m²</div>
                    <div className="text-sm text-gray-600">Diện tích</div>
                  </div>
                  <div>
                    <div className="text-xl font-semibold">{getRoomTypeLabel(listing.roomType)}</div>
                    <div className="text-sm text-gray-600">Loại phòng</div>
                  </div>
                </div>

                <div className="h-12 w-px bg-gray-200" />

                <div className="flex items-center gap-2">
                  <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                  <div>
                    <div className="text-xl font-semibold">{averageRating.toFixed(1)}</div>
                    <div className="text-sm text-gray-600">{reviews.length} đánh giá</div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-3">Mô tả</h2>
                <p className="text-gray-700 leading-relaxed">
                  {listing.description}
                </p>
              </div>

              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-3">Tiện nghi</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {listing.amenities.map((amenity, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
                    >
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-gray-700">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-6">
                Đánh giá từ người thuê ({reviews.length})
              </h2>

              {reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                      <div className="flex items-start gap-4">
                        <img
                          src={review.userAvatar}
                          alt={review.userName}
                          className="w-12 h-12 rounded-full"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <div className="font-semibold">{review.userName}</div>
                              <div className="text-sm text-gray-600">
                                {formatDate(review.createdAt)}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i < review.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                    }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-700">{review.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Chưa có đánh giá nào
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Landlord Info Card */}
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-20">
              <Link 
                href={`/app/profile/${listing.landlordId}`}
                className="flex items-center gap-4 mb-6 group hover:opacity-95 transition-all cursor-pointer"
              >
                <img
                  src={listing.landlordAvatar}
                  alt={listing.landlordName}
                  className="w-16 h-16 rounded-full border border-gray-100 shadow-sm"
                />
                <div>
                  <div className="font-semibold text-lg group-hover:text-blue-600 transition-colors">
                    {listing.landlordName}
                  </div>
                  <div className="text-sm text-gray-600">Chủ trọ</div>
                  {listing.landlordVerified && (
                    <div className="flex items-center gap-1 text-green-600 text-sm mt-1">
                      <CheckCircle className="h-4 w-4" />
                      <span>Đã xác minh</span>
                    </div>
                  )}
                </div>
              </Link>

              <div className="space-y-3">
                <button
                  onClick={() => setShowContactModal(true)}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  <MessageCircle className="h-5 w-5" />
                  Nhắn tin
                </button>

                <button className="w-full flex items-center justify-center gap-2 bg-white border-2 border-blue-600 text-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                  <Phone className="h-5 w-5" />
                  Gọi điện
                </button>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <strong>Lưu ý:</strong> Không chuyển tiền cọc trước khi xem phòng trực tiếp
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold mb-4">Liên hệ chủ trọ</h3>
            <p className="text-gray-600 mb-6">
              Gửi tin nhắn cho {listing.landlordName} về phòng trọ này
            </p>

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nội dung tin nhắn
                </label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Xin chào, tôi quan tâm đến phòng trọ của bạn..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowContactModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                  Gửi tin nhắn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
