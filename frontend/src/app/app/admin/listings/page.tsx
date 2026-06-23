"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Trash2, 
  ShieldAlert, 
  RefreshCw, 
  User, 
  AlertCircle, 
  MapPin, 
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { listingApi } from "@/lib/api/listing.api";
import { Listing, ListingStatus } from "@/types/listing.types";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminListingsPage() {
  const { data: session, status: authStatus } = useSession();
  const fetchedRef = useRef(false);

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ListingStatus | "ALL">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Phân trang
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  // Trạng thái thao tác
  const [actionLoading, setActionLoading] = useState<string | number | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  // Tải danh sách tin đăng từ Backend
  const fetchListings = async (page = currentPage, status = statusFilter) => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      const params = {
        page,
        size: pageSize,
        sort: "createdAt,desc",
        ...(status !== "ALL" ? { status } : {}),
      };
      
      const res = await listingApi.getAdminListings(params);
      if (res.success && res.data) {
        setListings(res.data.content || []);
        
        // Trích xuất thông tin phân trang linh hoạt
        const pageTotal = res.data.totalPages ?? res.data.page?.totalPages ?? 0;
        const elemTotal = res.data.totalElements ?? res.data.page?.totalElements ?? 0;
        
        setTotalPages(pageTotal);
        setTotalElements(elemTotal);
      } else {
        toast.error("Không thể tải danh sách tin đăng.");
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách tin đăng admin:", error);
      toast.error("Đã xảy ra lỗi kết nối khi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authStatus === "loading") return;

    if (authStatus === "authenticated") {
      if (session?.user?.role !== "ADMIN") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(false);
      } else if (session?.accessToken && !fetchedRef.current) {
        fetchedRef.current = true;
        fetchListings(0, "ALL");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, authStatus]);

  // Thay đổi trang
  const handlePageChange = (newPage: number) => {
    if (newPage < 0 || newPage >= totalPages) return;
    setCurrentPage(newPage);
    fetchListings(newPage, statusFilter);
  };

  // Thay đổi bộ lọc trạng thái
  const handleStatusFilterChange = (newStatus: ListingStatus | "ALL") => {
    setStatusFilter(newStatus);
    setCurrentPage(0);
    fetchListings(0, newStatus);
  };

  // Cập nhật trạng thái tin đăng (Active / Inactive)
  const handleUpdateStatus = async (id: string | number, currentStatus: ListingStatus, newStatus: ListingStatus) => {
    setActionLoading(id);
    try {
      const res = await listingApi.updateAdminListingStatus(id, newStatus);
      if (res.success) {
        toast.success(`Đã cập nhật trạng thái tin đăng sang ${getStatusLabel(newStatus)}!`);
        // Cập nhật lại UI local
        setListings(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
        if (selectedListing && selectedListing.id === id) {
          setSelectedListing(prev => prev ? { ...prev, status: newStatus } : null);
        }
      } else {
        toast.error(res.message || "Không thể cập nhật trạng thái.");
      }
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái tin đăng:", error);
      toast.error("Lỗi kết nối khi cập nhật trạng thái.");
    } finally {
      setActionLoading(null);
    }
  };

  // Soft delete tin đăng
  const handleDeleteListing = async (id: string | number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn tin đăng này không? (Trạng thái sẽ chuyển thành DELETED)")) return;
    
    setActionLoading(id);
    try {
      const res = await listingApi.updateAdminListingStatus(id, "DELETED");
      if (res.success) {
        toast.success("Đã chuyển trạng thái tin đăng thành DELETED.");
        setListings(prev => prev.map(item => item.id === id ? { ...item, status: "DELETED" as const } : item));
        if (selectedListing && selectedListing.id === id) {
          setSelectedListing(prev => prev ? { ...prev, status: "DELETED" as const } : null);
        }
      } else {
        toast.error(res.message || "Không thể xóa tin đăng.");
      }
    } catch (error) {
      console.error("Lỗi xóa tin đăng:", error);
      toast.error("Lỗi kết nối khi xóa tin đăng.");
    } finally {
      setActionLoading(null);
    }
  };

  // Định dạng hiển thị tiền tệ
  const formatPrice = (price?: number) => {
    if (price === undefined) return "0 đ";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Helper nhãn trạng thái
  const getStatusLabel = (status: ListingStatus) => {
    switch (status) {
      case "ACTIVE": return "Đang hoạt động";
      case "PENDING": return "Chờ duyệt";
      case "REJECTED": return "Bị từ chối";
      case "INACTIVE": return "Đã tạm ẩn";
      case "RENTED": return "Đã cho thuê";
      case "DRAFT": return "Bản nháp";
      case "DELETED": return "Đã xóa";
      default: return status;
    }
  };

  // Helper màu sắc trạng thái
  const getStatusBadgeClass = (status: ListingStatus) => {
    switch (status) {
      case "ACTIVE": return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "PENDING": return "bg-yellow-50 text-yellow-700 border-yellow-100";
      case "REJECTED": return "bg-red-50 text-red-700 border-red-100";
      case "INACTIVE": return "bg-gray-100 text-gray-700 border-gray-200";
      case "RENTED": return "bg-blue-50 text-blue-700 border-blue-100";
      case "DRAFT": return "bg-amber-50 text-amber-700 border-amber-100";
      case "DELETED": return "bg-rose-50 text-rose-700 border-rose-100";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Lọc client-side cho ô tìm kiếm
  const filteredListings = listings.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.landlordName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Kiểm tra trạng thái tải phiên đăng nhập
  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 py-12 flex flex-col items-center justify-center">
        <RefreshCw className="h-10 w-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 text-sm font-semibold">Đang tải danh sách tin đăng...</p>
      </div>
    );
  }

  // Kiểm tra quyền hạn Admin
  if (authStatus === "unauthenticated" || session?.user?.role !== "ADMIN") {
    return (
      <div className="min-h-[85vh] bg-gray-50/50 py-12 flex items-center justify-center px-4">
        <div className="max-w-md bg-white border border-gray-100 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-3xl p-8 text-center">
          <ShieldAlert className="h-14 w-14 text-red-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-extrabold text-gray-800 mb-2">Quyền truy cập bị giới hạn</h2>
          <p className="text-gray-500 text-sm mb-6">
            Bạn cần đăng nhập tài khoản có quyền quản trị viên (ADMIN) để quản lý các tin đăng hệ thống.
          </p>
          <Link
            href="/"
            className="block w-full bg-gray-900 text-white py-3 rounded-2xl font-bold hover:bg-gray-800 transition-all text-sm text-center"
          >
            Trở về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">
              Quản lý tin đăng hệ thống
            </h1>
            <p className="text-xs text-gray-400 font-medium mt-1">
              Phê duyệt, quản lý hiển thị và kiểm duyệt thông tin phòng trọ của toàn bộ chủ nhà
            </p>
          </div>
          <button
            onClick={() => fetchListings(currentPage, statusFilter)}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 self-start sm:self-auto"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Làm mới</span>
          </button>
        </div>

        {/* Filters & Search Bar */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-lg shadow-gray-200/20 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Buttons */}
          <div className="flex flex-wrap gap-1.5">
            {(["ALL", "PENDING", "ACTIVE", "REJECTED", "INACTIVE", "RENTED", "DRAFT", "DELETED"] as const).map((status) => (
              <button
                key={status}
                onClick={() => handleStatusFilterChange(status)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                  statusFilter === status
                    ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10"
                    : "bg-white text-gray-600 border-gray-150 hover:bg-gray-50"
                }`}
              >
                {status === "ALL" ? "Tất cả" : getStatusLabel(status as ListingStatus)}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:max-w-xs">
            <input
              type="text"
              placeholder="Tìm theo tiêu đề, chủ trọ, địa chỉ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
        </div>

        {/* Listings Table */}
        <div className="bg-white border border-gray-100 rounded-3xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4.5 text-xs font-extrabold text-gray-400 uppercase tracking-wider">Tin đăng</th>
                  <th className="px-6 py-4.5 text-xs font-extrabold text-gray-400 uppercase tracking-wider">Chủ trọ</th>
                  <th className="px-6 py-4.5 text-xs font-extrabold text-gray-400 uppercase tracking-wider">Giá thuê</th>
                  <th className="px-6 py-4.5 text-xs font-extrabold text-gray-400 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-4.5 text-right text-xs font-extrabold text-gray-400 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredListings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3.5">
                        <div className="h-14 w-14 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                          {listing.images && listing.images.length > 0 ? (
                            <img
                              src={listing.images[0].imageUrl}
                              alt={listing.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs">
                              No image
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-extrabold text-gray-800 text-sm line-clamp-1 max-w-sm sm:max-w-md">
                            {listing.title}
                          </div>
                          <div className="text-xs text-gray-400 font-medium flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3 text-gray-300" />
                            <span>{listing.district || listing.city || listing.address}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                        <div className="font-bold text-gray-700 text-sm">{listing.landlordName}</div>
                      </div>
                    </td>

                    <td className="px-6 py-5 font-bold text-blue-600 text-sm">
                      {formatPrice(listing.pricePerMonth)}/tháng
                    </td>

                    <td className="px-6 py-5">
                      <span className={`inline-flex px-3 py-1 text-xs font-bold border rounded-full ${getStatusBadgeClass(listing.status)}`}>
                        {getStatusLabel(listing.status)}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Xem chi tiết */}
                        <button
                          onClick={() => setSelectedListing(listing)}
                          className="p-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl shadow-sm transition-all active:scale-95"
                          title="Xem nhanh chi tiết"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Duyệt / Kích hoạt lại */}
                        {listing.status !== "ACTIVE" && listing.status !== "DELETED" && (
                          <button
                            onClick={() => handleUpdateStatus(listing.id, listing.status, "ACTIVE")}
                            disabled={actionLoading === listing.id}
                            className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
                            title="Phê duyệt / Kích hoạt hoạt động"
                          >
                            {actionLoading === listing.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </button>
                        )}

                        {/* Tạm ẩn / Khóa tin */}
                        {listing.status === "ACTIVE" && (
                          <button
                            onClick={() => handleUpdateStatus(listing.id, listing.status, "INACTIVE")}
                            disabled={actionLoading === listing.id}
                            className="p-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
                            title="Tạm khóa / Ẩn tin"
                          >
                            {actionLoading === listing.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                          </button>
                        )}

                        {/* Xóa tin */}
                        {listing.status !== "DELETED" && (
                          <button
                            onClick={() => handleDeleteListing(listing.id)}
                            disabled={actionLoading === listing.id}
                            className="p-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
                            title="Đánh dấu xóa"
                          >
                            {actionLoading === listing.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredListings.length === 0 && (
            <div className="text-center py-16 px-4 bg-gray-50/20">
              <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-700 mb-1">Không tìm thấy tin đăng nào</h3>
              <p className="text-xs text-gray-400">Danh sách trống hoặc không có bản ghi nào khớp bộ lọc.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-5 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400">
                Hiển thị {filteredListings.length} tin trong tổng số {totalElements} tin đăng
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="p-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 rounded-xl text-xs font-bold disabled:opacity-40 disabled:hover:bg-white transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handlePageChange(index)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      currentPage === index
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages - 1}
                  className="p-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 rounded-xl text-xs font-bold disabled:opacity-40 disabled:hover:bg-white transition-all"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Xem nhanh chi tiết (Listing Preview Modal) */}
      <AnimatePresence>
        {selectedListing && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] max-w-3xl w-full overflow-hidden max-h-[92vh] flex flex-col"
            >
              {/* Header Modal */}
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-extrabold text-gray-800">Thẩm định thông tin tin đăng</h2>
                  <p className="text-xs text-gray-400 font-medium">Xem nhanh hình ảnh, mô tả phòng trọ trên hệ thống</p>
                </div>
                <button
                  onClick={() => setSelectedListing(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              {/* Body Modal */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* Images Carousel */}
                {selectedListing.images && selectedListing.images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {selectedListing.images.map((img) => (
                      <div key={img.id} className="relative h-28 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
                        <img src={img.imageUrl} alt="Tin đăng" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-28 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 text-xs">
                    Tin đăng này chưa cập nhật hình ảnh
                  </div>
                )}

                {/* Tiêu đề & Thông tin cơ bản */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex px-2.5 py-0.5 text-[10px] font-bold border rounded-full ${getStatusBadgeClass(selectedListing.status)}`}>
                      {getStatusLabel(selectedListing.status)}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                      Đăng lúc: {new Date(selectedListing.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-gray-800 leading-snug">{selectedListing.title}</h3>
                  <div className="text-xs text-gray-500 font-bold flex items-center gap-1 mt-1.5">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                    <span>{selectedListing.address}</span>
                  </div>
                </div>

                {/* Các tiện ích phòng */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4.5 bg-gray-50 border border-gray-100 rounded-2xl">
                  <div>
                    <span className="text-[10px] text-gray-400 block font-bold">Diện tích</span>
                    <span className="text-sm font-extrabold text-gray-700">{selectedListing.areaM2 || "--"} m²</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block font-bold">Giá cho thuê</span>
                    <span className="text-sm font-extrabold text-blue-600">{formatPrice(selectedListing.pricePerMonth)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block font-bold">Phòng ngủ</span>
                    <span className="text-sm font-extrabold text-gray-700">{selectedListing.numBedrooms ?? 0} phòng</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block font-bold">Phòng tắm</span>
                    <span className="text-sm font-extrabold text-gray-700">{selectedListing.numBathrooms ?? 0} phòng</span>
                  </div>
                </div>

                {/* Mô tả chi tiết */}
                <div>
                  <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">Mô tả phòng trọ</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 border border-gray-100 p-4 rounded-2xl whitespace-pre-line leading-relaxed">
                    {selectedListing.description || "Không có nội dung mô tả chi tiết."}
                  </p>
                </div>

                {/* Tiện nghi */}
                <div>
                  <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2.5">Tiện nghi có sẵn</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedListing.hasWifi && (
                      <span className="inline-flex px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 rounded-xl">Wifi miễn phí</span>
                    )}
                    {selectedListing.hasParking && (
                      <span className="inline-flex px-3 py-1.5 text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-200 rounded-xl">Bãi đỗ xe</span>
                    )}
                    {selectedListing.hasAirConditioner && (
                      <span className="inline-flex px-3 py-1.5 text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-100 rounded-xl">Điều hòa nhiệt độ</span>
                    )}
                    {selectedListing.hasWashingMachine && (
                      <span className="inline-flex px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl">Máy giặt</span>
                    )}
                    {selectedListing.allowPets && (
                      <span className="inline-flex px-3 py-1.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100 rounded-xl">Cho phép nuôi thú cưng</span>
                    )}
                    {!selectedListing.hasWifi && !selectedListing.hasParking && !selectedListing.hasAirConditioner && !selectedListing.hasWashingMachine && !selectedListing.allowPets && (
                      <span className="text-xs text-gray-400 font-medium">Không cập nhật tiện nghi.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer Modal Actions */}
              <div className="p-6 border-t border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setSelectedListing(null)}
                  className="flex-1 px-5 py-3 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-2xl text-xs font-bold transition-all active:scale-95"
                >
                  Đóng cửa sổ
                </button>
                {selectedListing.status !== "ACTIVE" && selectedListing.status !== "DELETED" && (
                  <button
                    onClick={() => handleUpdateStatus(selectedListing.id, selectedListing.status, "ACTIVE")}
                    disabled={actionLoading === selectedListing.id}
                    className="flex-1 px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl text-xs font-bold shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle className="h-4.5 w-4.5" />
                    <span>Duyệt & Kích hoạt tin</span>
                  </button>
                )}
                {selectedListing.status === "ACTIVE" && (
                  <button
                    onClick={() => handleUpdateStatus(selectedListing.id, selectedListing.status, "INACTIVE")}
                    disabled={actionLoading === selectedListing.id}
                    className="flex-1 px-5 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-2xl text-xs font-bold shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <XCircle className="h-4.5 w-4.5" />
                    <span>Tạm khóa / Ẩn tin</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
