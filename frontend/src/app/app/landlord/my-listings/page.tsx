"use client";

import { useState } from "react";
import Link from "next/link";
import { PlusCircle, Edit, Eye, Trash2, ToggleLeft, ToggleRight, Loader2, TrendingUp, Calendar, X } from "lucide-react";
import { useMyListings } from "@/hooks/useListings";
import { useQueryClient } from "@tanstack/react-query";
import { listingApi } from "@/lib/api/listing.api";
import type { ListingStatus } from "@/types/listing.types";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

function getRoomTypeLabel(type: string): string {
  const map: Record<string, string> = {
    single: "Phòng đơn",
    shared: "Phòng ghép",
    apartment: "Căn hộ",
    house: "Nhà nguyên căn",
  };
  return map[type] || type;
}

export default function MyListingsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<ListingStatus | "ALL">("ALL");

  // Fetch real listings from backend
  const { data: apiResponse, isLoading } = useMyListings(
    statusFilter !== "ALL" ? { status: statusFilter } : undefined
  );
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Promote state variables
  const [promoteModalOpen, setPromoteModalOpen] = useState(false);
  const [promoteListingId, setPromoteListingId] = useState<string | null>(null);
  const [promoteListingTitle, setPromoteListingTitle] = useState("");
  const [durationDays, setDurationDays] = useState(3);
  const [promoteLoading, setPromoteLoading] = useState(false);

  const handleOpenPromoteModal = (id: string, title: string) => {
    setPromoteListingId(id);
    setPromoteListingTitle(title);
    setDurationDays(3);
    setPromoteModalOpen(true);
  };

  const handlePromoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoteListingId) return;

    setPromoteLoading(true);
    setError("");
    try {
      const response = await listingApi.promoteListing(promoteListingId, durationDays);
      if (response.data?.paymentUrl) {
        // Redirect to VNPay
        window.location.href = response.data.paymentUrl;
      } else {
        throw new Error("Không nhận được URL thanh toán từ hệ thống.");
      }
    } catch (err: unknown) {
      console.error("Error promoting listing:", err);
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message 
        || (err as Error)?.message 
        || "Không thể khởi tạo thanh toán đẩy tin.";
      setError(errorMsg);
      setPromoteModalOpen(false);
    } finally {
      setPromoteLoading(false);
    }
  };

  const apiListings = apiResponse?.data?.content || [];

  // Transform real backend response to match layout variables
  const myListings = apiListings.map((l) => ({
    id: String(l.id),
    title: l.title,
    district: l.district || "Chưa rõ",
    area: l.areaM2 || 0,
    roomType: "single", // fallback
    price: l.pricePerMonth,
    images: l.images && l.images.length > 0
      ? l.images.map((img) => img.imageUrl)
      : ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop"],
    status: l.status,
    originalStatus: l.status,
    rating: l.averageRating !== undefined && l.averageRating !== null ? l.averageRating : 0,
    reviewCount: l.reviewCount || 0,
    isPromoted: l.isPromoted || false,
    promotedExpiresAt: l.promotedExpiresAt,
  }));

  const handleToggleStatus = async (id: string, currentStatus: ListingStatus) => {
    setActionLoading(id);
    setError("");
    try {
      // Toggle between ACTIVE (Còn trống) and RENTED (Đã cho thuê)
      const newStatus: ListingStatus = currentStatus === "ACTIVE" ? "RENTED" : "ACTIVE";
      await listingApi.updateListingStatus(id, newStatus);
      
      // Invalidate queries to refresh list
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    } catch (err) {
      console.error("Error toggling status:", err);
      setError("Không thể cập nhật trạng thái tin đăng.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tin đăng "${title}"?`)) {
      return;
    }
    setActionLoading(id);
    setError("");
    try {
      await listingApi.deleteListing(id);
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    } catch (err) {
      console.error("Error deleting listing:", err);
      setError("Không thể xóa tin đăng này.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Quản lý tin đăng</h1>
            <p className="text-gray-600 mt-2">
              Bạn đang có <strong>{myListings.length}</strong> tin đăng
            </p>
          </div>

          <Link
            href="/app/landlord/create-listing"
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <PlusCircle className="h-5 w-5" />
            Đăng tin mới
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg text-red-700 text-sm font-medium">
            ⚠️ {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">Tổng tin đăng</div>
            <div className="text-2xl font-bold text-gray-900">{myListings.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">Đang hiển thị</div>
            <div className="text-2xl font-bold text-green-600">
              {myListings.filter((l) => l.status === "ACTIVE").length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">Đã cho thuê</div>
            <div className="text-2xl font-bold text-blue-600">
              {myListings.filter((l) => l.status === "RENTED").length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">Chờ duyệt</div>
            <div className="text-2xl font-bold text-yellow-600">
              {myListings.filter((l) => l.status === "PENDING").length}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(["ALL", "PENDING", "ACTIVE", "REJECTED", "RENTED", "INACTIVE"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                statusFilter === status
                  ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {status === "ALL"
                ? "Tất cả"
                : status === "PENDING"
                ? "Chờ duyệt"
                : status === "ACTIVE"
                ? "Đang hiển thị"
                : status === "REJECTED"
                ? "Bị từ chối"
                : status === "RENTED"
                ? "Đã cho thuê"
                : "Tạm ẩn"}
            </button>
          ))}
        </div>

        {/* Listings Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-500 font-medium">Đang tải danh sách tin đăng...</p>
            </div>
          ) : (
            <>
              {myListings.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tin đăng
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Giá
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trạng thái
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Đánh giá
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {myListings.map((listing) => {
                        const isOperating = actionLoading === listing.id;
                        return (
                          <tr key={listing.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                <img
                                  src={listing.images[0]}
                                  alt={listing.title}
                                  className="w-16 h-16 rounded-lg object-cover"
                                />
                                <div>
                                  <div className="font-semibold text-gray-900 line-clamp-1 flex items-center gap-2 flex-wrap">
                                    {listing.title}
                                    {listing.isPromoted && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 shadow-sm animate-pulse">
                                        ✨ Nổi bật
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {listing.district} • {listing.area}m² • {getRoomTypeLabel(listing.roomType)}
                                  </div>
                                  {listing.isPromoted && listing.promotedExpiresAt && (
                                    <div className="text-xs text-amber-600 mt-1 flex items-center gap-1 font-semibold">
                                      <Calendar className="h-3 w-3" />
                                      Hạn nổi bật: {new Date(listing.promotedExpiresAt).toLocaleDateString("vi-VN")}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-semibold text-blue-600">
                                {formatPrice(listing.price)}
                              </div>
                              <div className="text-xs text-gray-500">/tháng</div>
                            </td>
                            <td className="px-6 py-4">
                              {listing.status === "ACTIVE" ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Đang hiển thị
                                </span>
                              ) : listing.status === "PENDING" ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Chờ duyệt
                                </span>
                              ) : listing.status === "REJECTED" ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Bị từ chối
                                </span>
                              ) : listing.status === "RENTED" ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Đã cho thuê
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  Tạm ẩn
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1">
                                <span className="text-yellow-500">★</span>
                                <span className="font-semibold">{listing.rating > 0 ? listing.rating.toFixed(1) : "—"}</span>
                                <span className="text-gray-500 text-sm">({listing.reviewCount})</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-3">
                                <Link
                                  href={`/app/listings/${listing.id}`}
                                  className="p-3 text-gray-600 hover:bg-gray-100 rounded-lg hover:text-gray-900 transition-colors"
                                  title="Xem chi tiết"
                                >
                                  <Eye className="h-5 w-5" />
                                </Link>
                                <Link
                                  href={`/app/landlord/edit-listing/${listing.id}`}
                                  className="p-3 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Chỉnh sửa"
                                >
                                  <Edit className="h-5 w-5" />
                                </Link>
                                {listing.status === "ACTIVE" && (
                                  <button
                                    onClick={() => handleOpenPromoteModal(listing.id, listing.title)}
                                    disabled={isOperating}
                                    className="p-3 text-amber-600 hover:bg-amber-50 rounded-lg disabled:opacity-50 transition-colors"
                                    title="Đẩy tin nổi bật (Boost)"
                                  >
                                    <TrendingUp className="h-5 w-5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleToggleStatus(listing.id, listing.originalStatus)}
                                  disabled={isOperating}
                                  className="p-3 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50 transition-colors"
                                  title={listing.status === "ACTIVE" ? "Đổi sang Đã cho thuê" : "Đổi sang Đang hiển thị"}
                                >
                                  {isOperating ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                  ) : listing.status === "ACTIVE" ? (
                                    <ToggleRight className="h-5 w-5" />
                                  ) : (
                                    <ToggleLeft className="h-5 w-5" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDelete(listing.id, listing.title)}
                                  disabled={isOperating}
                                  className="p-3 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 transition-colors"
                                  title="Xóa"
                                >
                                  {isOperating ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-5 w-5" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {myListings.length === 0 && (
                <div className="text-center py-12">
                  <PlusCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Chưa có tin đăng nào
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Bắt đầu đăng tin để cho thuê phòng trọ của bạn
                  </p>
                  <Link
                    href="/app/landlord/create-listing"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                  >
                    <PlusCircle className="h-5 w-5" />
                    Đăng tin đầu tiên
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Promote Listing Modal */}
      {promoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-gray-100">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-amber-500" />
                Đẩy tin nổi bật (Boost Tin)
              </h3>
              <button
                onClick={() => setPromoteModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePromoteSubmit} className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Tin đăng nổi bật sẽ được sắp xếp lên đầu danh sách tìm kiếm, giúp tiếp cận người thuê nhanh gấp <strong className="text-blue-600">5 lần</strong>!
              </p>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                <div className="text-xs text-blue-700 uppercase font-semibold tracking-wider">Tin đang chọn</div>
                <div className="text-sm font-bold text-gray-900 line-clamp-2 mt-1">{promoteListingTitle}</div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Chọn số ngày quảng cáo:
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { days: 1, label: "1 Ngày", price: 20000 },
                    { days: 3, label: "3 Ngày", price: 60000 },
                    { days: 7, label: "7 Ngày", price: 140000 },
                  ].map((pkg) => (
                    <button
                      key={pkg.days}
                      type="button"
                      onClick={() => setDurationDays(pkg.days)}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                        durationDays === pkg.days
                          ? "border-blue-600 bg-blue-50/30 text-blue-600 shadow-md shadow-blue-500/5"
                          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                      }`}
                    >
                      <span className="font-bold text-sm">{pkg.label}</span>
                      <span className="text-xs text-gray-500 mt-1">{pkg.price.toLocaleString("vi-VN")}đ</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-100 rounded-xl mb-6">
                <span className="text-sm text-amber-800 font-semibold">Tổng chi phí:</span>
                <span className="text-lg font-bold text-amber-700">
                  {(durationDays * 20000).toLocaleString("vi-VN")}đ
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPromoteModalOpen(false)}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={promoteLoading}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-all shadow-md shadow-amber-500/10 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {promoteLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Đang tạo đơn...
                    </>
                  ) : (
                    <>
                      Thanh toán VNPay
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
