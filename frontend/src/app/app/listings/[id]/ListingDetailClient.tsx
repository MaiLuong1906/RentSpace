"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
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
  Flag,
  ShieldCheck,
} from "lucide-react";
import { useListing } from "@/hooks/useListings";
import { listingApi } from "@/lib/api/listing.api";
import { ReviewSection, ReportModal } from "@/components/review";
import { chatApi } from "@/lib/api/chat";
import { useChatStore } from "@/store/chatStore";
import { useChat } from "@/hooks/useChat";
import { toast } from "sonner";
import { ListingDetailSkeleton } from "@/components/listing";
import { useSession } from "next-auth/react";
import { depositApi } from "@/lib/api/deposit.api";

interface ListingDetailClientProps {
  listingId: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ACTIVE:   { label: "Còn trống",   color: "bg-green-100 text-green-700" },
  RENTED:   { label: "Đã cho thuê", color: "bg-red-100 text-red-700" },
  INACTIVE: { label: "Tạm ẩn",      color: "bg-yellow-100 text-yellow-700" },
  DRAFT:    { label: "Bản nháp",    color: "bg-gray-100 text-gray-600" },
};

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

export function ListingDetailClient({ listingId }: ListingDetailClientProps) {
  const router = useRouter();
  const { data: apiResponse, isLoading, isError } = useListing(listingId);
  const listing = apiResponse?.data;

  const { data: session } = useSession();

  // Track listing view on mount
  useEffect(() => {
    if (listingId) {
      listingApi.trackListingView(listingId).catch((err) => {
        console.error("Error tracking listing view:", err);
      });
    }
  }, [listingId]);
  const isLandlord = session?.user?.id && Number(session.user.id) === Number(listing?.landlordId);

  const [selectedImage, setSelectedImage] = useState(0);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const { setActiveConversation } = useChatStore();
  const { sendMessage } = useChat();
  const [contactMessage, setContactMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Deposit modal state
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [moveInDate, setMoveInDate] = useState("");
  const [depositNotes, setDepositNotes] = useState("");
  const [isCreatingDeposit, setIsCreatingDeposit] = useState(false);

  const handleDepositClick = () => {
    if (!session) {
      toast.warning("Vui lòng đăng nhập tài khoản Người thuê để thực hiện đặt cọc.");
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (session.user.role !== "TENANT") {
      toast.error("Chỉ tài khoản Người thuê (Tenant) mới có thể thực hiện đặt cọc.");
      return;
    }
    if (listing) {
      setDepositAmount(listing.pricePerMonth);
    }
    setShowDepositModal(true);
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing) return;
    if (!moveInDate) {
      toast.error("Vui lòng chọn ngày dự kiến nhận phòng.");
      return;
    }
    if (depositAmount <= 0) {
      toast.error("Số tiền đặt cọc phải lớn hơn 0đ.");
      return;
    }

    setIsCreatingDeposit(true);
    try {
      const response = await depositApi.createDeposit(
        listing.id,
        depositAmount,
        moveInDate,
        depositNotes.trim()
      );
      if (response.success && response.data) {
        toast.success("Tạo yêu cầu đặt cọc thành công!");
        router.push(`/app/checkout/${response.data.id}`);
      } else {
        toast.error(response.message || "Tạo yêu cầu đặt cọc thất bại.");
      }
    } catch (err: unknown) {
      console.error("Lỗi khi tạo đặt cọc:", err);
      const apiError = err as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || "Không thể tạo yêu cầu đặt cọc. Vui lòng thử lại.");
    } finally {
      setIsCreatingDeposit(false);
      setShowDepositModal(false);
    }
  };

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
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title & Basic Info */}
            <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
              <h1 className="text-3xl font-bold text-gray-900">{listing.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-gray-500 shrink-0" />
                  <span>{listing.address}, {listing.district}, {listing.city}</span>
                </div>
                {listing.averageRating !== undefined && listing.averageRating !== null && listing.averageRating > 0 && (
                  <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2.5 py-0.5 rounded-full border border-yellow-250 font-semibold text-xs">
                    ★ {listing.averageRating.toFixed(1)} ({listing.reviewCount} đánh giá)
                  </div>
                )}
              </div>
              <div className="flex items-baseline gap-4 pt-2">
                <span className="text-3xl font-extrabold text-blue-600">
                  {formatPrice(listing.pricePerMonth)}/tháng
                </span>
                <span className="text-gray-500">
                  Diện tích: <strong className="text-gray-800 font-bold">{listing.areaM2 || 0}m²</strong>
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Mô tả chi tiết</h2>
              <p className="text-gray-750 whitespace-pre-line leading-relaxed text-[15px]">
                {listing.description || "Không có mô tả chi tiết từ chủ trọ."}
              </p>
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Tiện ích</h2>
              {amenities.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {amenities.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 text-gray-700">
                      <div className="p-2 bg-blue-50 rounded-lg shrink-0">{item.icon}</div>
                      <span className="text-sm font-semibold">{item.label}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Không có tiện ích đặc biệt nào được liệt kê.</p>
              )}
            </div>

            {/* Update Date */}
            <div className="bg-white rounded-xl shadow-md p-4 text-xs text-gray-500 flex justify-between items-center">
              <span>Đăng ngày: {formatDate(listing.createdAt)}</span>
              <span>Cập nhật: {formatDate(listing.updatedAt)}</span>
            </div>

            {/* Review Section */}
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
                {listing.status === "ACTIVE" && !isLandlord && (
                  <button
                    onClick={handleDepositClick}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-all cursor-pointer shadow-md shadow-emerald-100 hover:shadow-lg"
                  >
                    <ShieldCheck className="h-5 w-5" />
                    Đặt cọc an toàn (Escrow)
                  </button>
                )}

                <button
                  onClick={() => setShowContactModal(true)}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  <MessageCircle className="h-5 w-5" />
                  Nhắn tin
                </button>

                <button className="w-full flex items-center justify-center gap-2 bg-white border-2 border-blue-600 text-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors cursor-pointer">
                  <Phone className="h-5 w-5" />
                  Gọi điện
                </button>

                <button
                  onClick={() => setShowReportModal(true)}
                  className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-red-600 py-2 text-sm transition-colors cursor-pointer"
                >
                  <Flag className="h-4 w-4" />
                  Báo cáo vi phạm
                </button>
              </div>

              {/* Safety Note */}
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800 font-medium">
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
          <div className="bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] max-w-md w-full p-6">
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
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 flex items-center justify-center gap-2 cursor-pointer"
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

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] max-w-lg w-full overflow-hidden border border-gray-150 transform transition-all scale-100">
            {/* Header */}
            <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Đặt cọc giữ chỗ an toàn</h3>
                <p className="text-xs text-emerald-800 font-medium">Tiền cọc của bạn được giữ an toàn bởi RentSpace (Escrow)</p>
              </div>
            </div>

            <form onSubmit={handleDepositSubmit} className="p-6 space-y-4">
              {/* Tin đăng info summary */}
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex gap-3">
                {imageUrls[0] && (
                  <img src={imageUrls[0]} className="w-16 h-16 object-cover rounded-lg" alt="" />
                )}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{listing.title}</h4>
                  <p className="text-xs text-gray-500 line-clamp-1">{listing.address}</p>
                  <p className="text-sm font-bold text-blue-600 mt-1">{formatPrice(listing.pricePerMonth)}/tháng</p>
                </div>
              </div>

              {/* Amount input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Số tiền đặt cọc (VND)
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">₫</span>
                  </div>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm font-bold text-gray-800"
                    placeholder="Nhập số tiền đặt cọc"
                    required
                  />
                </div>
              </div>

              {/* Payment Summary Box */}
              <div className="bg-emerald-50/40 rounded-xl p-4 border border-emerald-100/50 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Số tiền cọc:</span>
                  <span className="font-semibold">{formatPrice(depositAmount)}</span>
                </div>
                <div className="flex justify-between text-gray-600 border-b border-dashed border-gray-200 pb-2">
                  <span className="flex items-center gap-1">
                    Phí nền tảng (2%):
                    <span className="text-[10px] text-gray-400 font-medium">(Tối đa 100k)</span>
                  </span>
                  <span className="font-semibold text-gray-700">
                    -{formatPrice(Math.min(depositAmount * 0.02, 100000))}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-800 font-bold pt-1">
                  <span>Chủ trọ nhận:</span>
                  <span>{formatPrice(depositAmount - Math.min(depositAmount * 0.02, 100000))}</span>
                </div>
              </div>

              {/* Move-in Date */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Ngày nhận phòng dự kiến
                </label>
                <input
                  type="date"
                  value={moveInDate}
                  onChange={(e) => setMoveInDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm text-gray-850"
                  required
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Ghi chú gửi chủ trọ
                </label>
                <textarea
                  rows={2}
                  value={depositNotes}
                  onChange={(e) => setDepositNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm text-gray-850"
                  placeholder="Gửi lời chào hoặc yêu cầu của bạn..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  disabled={isCreatingDeposit}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreatingDeposit}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:bg-gray-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-100 transition-colors"
                >
                  {isCreatingDeposit && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{isCreatingDeposit ? "Đang xử lý..." : "Xác nhận đặt cọc"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
