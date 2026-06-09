"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Share2,
  Heart,
  MessageCircle,
  Phone,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Wifi,
  Car,
  Wind,
  WashingMachine,
  PawPrint,
  Loader2,
  BedDouble,
  Bath,
  SquareCode,
  Flag,
} from "lucide-react";
import { useListing } from "@/hooks/useListings";
import { ReviewSection, ReportModal } from "@/components/review";
import { ListingDetailSkeleton } from "@/components/listing";
import { chatApi } from "@/lib/api/chat";
import { useChatStore } from "@/store/chatStore";
import { useChat } from "@/hooks/useChat";
import { toast } from "sonner";

// --- Helpers ---
function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ACTIVE:   { label: "Còn trống",   color: "bg-green-100 text-green-700" },
  RENTED:   { label: "Đã cho thuê", color: "bg-red-100 text-red-700" },
  INACTIVE: { label: "Tạm ẩn",      color: "bg-yellow-100 text-yellow-700" },
  DRAFT:    { label: "Bản nháp",    color: "bg-gray-100 text-gray-600" },
};

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { data: apiResponse, isLoading, isError } = useListing(id);
  const listing = apiResponse?.data;

  const [selectedImage, setSelectedImage] = useState(0);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const { setActiveConversation } = useChatStore();
  const { sendMessage } = useChat();
  const [contactMessage, setContactMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSending || !listing?.landlordId) return;

    setIsSending(true);
    try {
      // 1. Tạo hoặc lấy cuộc trò chuyện với Landlord
      const conversation = await chatApi.createConversation(listing.landlordId);

      // 2. Gửi tin nhắn đầu tiên qua WebSocket nếu có nội dung
      if (contactMessage.trim()) {
        sendMessage(listing.landlordId, contactMessage.trim());
      }

      // 3. Đánh dấu cuộc trò chuyện đang active và chuyển hướng sang trang nhắn tin
      setActiveConversation(conversation.id);
      router.push("/app/messages");
      toast.success("Đã kết nối cuộc trò chuyện thành công!");
    } catch (err) {
      console.error("Lỗi khi tạo kết nối chat:", err);
      toast.error("Không thể tạo kết nối trò chuyện. Vui lòng thử lại.");
    } finally {
      setIsSending(false);
      setShowContactModal(false);
    }
  };

  // --- Trạng thái Loading ---
  if (isLoading) {
    return <ListingDetailSkeleton />;
  }

  // --- Trạng thái Lỗi / Không tìm thấy ---
  if (isError || !listing) {
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

  // --- Danh sách ảnh & tiện ích ---
  const imageUrls = listing.images?.length > 0
    ? listing.images.map((img) => img.imageUrl)
    : ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop"];

  const amenities = [
    { label: "WiFi",       value: listing.hasWifi,           icon: <Wifi className="h-4 w-4 text-blue-500" /> },
    { label: "Đỗ xe",      value: listing.hasParking,        icon: <Car className="h-4 w-4 text-blue-500" /> },
    { label: "Điều hòa",   value: listing.hasAirConditioner, icon: <Wind className="h-4 w-4 text-blue-500" /> },
    { label: "Máy giặt",   value: listing.hasWashingMachine, icon: <WashingMachine className="h-4 w-4 text-blue-500" /> },
    { label: "Thú cưng",   value: listing.allowPets,         icon: <PawPrint className="h-4 w-4 text-blue-500" /> },
  ].filter((a) => a.value);

  const statusInfo = STATUS_LABELS[listing.status] ?? { label: listing.status, color: "bg-gray-100 text-gray-600" };

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
          {/* ===== Main Content ===== */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="relative h-96 bg-gray-200">
                <img
                  src={imageUrls[selectedImage]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
                {/* Status badge */}
                <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-full text-sm font-semibold ${statusInfo.color}`}>
                  {statusInfo.label}
                </div>
                <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm">
                  {selectedImage + 1} / {imageUrls.length}
                </div>
              </div>

              {imageUrls.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {imageUrls.map((src, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-24 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === index
                          ? "border-blue-600"
                          : "border-transparent hover:border-gray-300"
                      }`}
                    >
                      <img
                        src={src}
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
                  <div className="flex items-center gap-1 text-gray-600">
                    <MapPin className="h-5 w-5 flex-shrink-0" />
                    <span>
                      {[listing.address, listing.ward, listing.district, listing.city]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => setIsSaved(!isSaved)}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      isSaved
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

              {/* Price & Stats */}
              <div className="flex flex-wrap items-center gap-6 py-4 border-y border-gray-200">
                <div>
                  <div className="text-3xl font-bold text-blue-600">
                    {formatPrice(listing.pricePerMonth)}
                  </div>
                  <div className="text-sm text-gray-600">/ tháng</div>
                </div>

                <div className="h-12 w-px bg-gray-200" />

                <div className="flex items-center gap-5">
                  {listing.areaM2 && (
                    <div className="flex items-center gap-1.5">
                      <SquareCode className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="text-lg font-semibold">{listing.areaM2}m²</div>
                        <div className="text-xs text-gray-500">Diện tích</div>
                      </div>
                    </div>
                  )}
                  {typeof listing.numBedrooms === "number" && (
                    <div className="flex items-center gap-1.5">
                      <BedDouble className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="text-lg font-semibold">{listing.numBedrooms}</div>
                        <div className="text-xs text-gray-500">Phòng ngủ</div>
                      </div>
                    </div>
                  )}
                  {typeof listing.numBathrooms === "number" && (
                    <div className="flex items-center gap-1.5">
                      <Bath className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="text-lg font-semibold">{listing.numBathrooms}</div>
                        <div className="text-xs text-gray-500">Phòng tắm</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {listing.description && (
                <div className="mt-6">
                  <h2 className="text-xl font-semibold mb-3">Mô tả</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {listing.description}
                  </p>
                </div>
              )}

              {/* Amenities */}
              {amenities.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-xl font-semibold mb-3">Tiện nghi</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {amenities.map((a) => (
                      <div
                        key={a.label}
                        className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
                      >
                        {a.icon}
                        <span className="text-gray-700">{a.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="mt-6 pt-4 border-t border-gray-100 text-sm text-gray-500 flex gap-4">
                <span>Đăng ngày: {formatDate(listing.createdAt)}</span>
                <span>Cập nhật: {formatDate(listing.updatedAt)}</span>
              </div>
            </div>

            {/* ===== Khu vực đánh giá ===== */}
            <ReviewSection listingId={listing.id} />
          </div>

          {/* ===== Sidebar ===== */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-20">
              {/* Landlord Info */}
              <div className="flex items-center gap-4 mb-6">
                {listing.landlordAvatar ? (
                  <img
                    src={listing.landlordAvatar}
                    alt={listing.landlordName}
                    className="w-16 h-16 rounded-full border border-gray-100 shadow-sm object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold">
                    {listing.landlordName?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-lg">{listing.landlordName}</div>
                  <div className="text-sm text-gray-600">Chủ trọ</div>
                  <div className="flex items-center gap-1 text-green-600 text-sm mt-1">
                    <CheckCircle className="h-4 w-4" />
                    <span>Đã xác minh</span>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
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

                {/* Nút Báo cáo vi phạm */}
                <button
                  onClick={() => setShowReportModal(true)}
                  className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-red-600 py-2 text-sm transition-colors"
                >
                  <Flag className="h-4 w-4" />
                  Báo cáo vi phạm
                </button>
              </div>

              {/* Safety Note */}
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

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nội dung tin nhắn
                </label>
                <textarea
                  rows={4}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-800"
                  placeholder="Xin chào, tôi quan tâm đến phòng trọ của bạn..."
                  disabled={isSending}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowContactModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                  disabled={isSending}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 flex items-center justify-center gap-2"
                >
                  {isSending && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{isSending ? "Đang gửi..." : "Gửi tin nhắn"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          listingId={listing.id}
          listingTitle={listing.title}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}
