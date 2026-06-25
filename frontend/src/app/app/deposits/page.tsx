"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { depositApi } from "@/lib/api/deposit.api";
import { transactionReviewApi } from "@/lib/api/transaction-review.api";
import { DepositTransaction } from "@/types/phase2.types";
import { ReviewModal } from "@/components/reviews/ReviewModal";
import {
  ShieldCheck,
  Loader2,
  AlertTriangle,
  Calendar,
  User,
  CreditCard,
  FileText,
  CheckCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  Star
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const STATUS_LABELS: Record<DepositTransaction["status"], { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  PENDING_PAYMENT: { label: "Chờ thanh toán", bg: "bg-amber-50 border-amber-200", text: "text-amber-700", icon: <Clock className="h-4 w-4" /> },
  PAID: { label: "Đã đặt cọc (Escrow)", bg: "bg-emerald-50 border-emerald-250", text: "text-emerald-700", icon: <ShieldCheck className="h-4 w-4" /> },
  DISPUTED: { label: "Đang tranh chấp", bg: "bg-rose-50 border-rose-250", text: "text-rose-700", icon: <AlertTriangle className="h-4 w-4" /> },
  RELEASED: { label: "Đã giải ngân", bg: "bg-blue-50 border-blue-200", text: "text-blue-700", icon: <CheckCircle className="h-4 w-4" /> },
  REFUNDED: { label: "Đã hoàn tiền", bg: "bg-gray-50 border-gray-200", text: "text-gray-600", icon: <ArrowRight className="h-4 w-4" /> },
  CANCELLED: { label: "Đã hủy", bg: "bg-gray-150 border-gray-300", text: "text-gray-600", icon: <XCircleIcon /> },
};

function XCircleIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export default function DepositsPage() {
  const { data: session, status: authStatus } = useSession();
  const [deposits, setDeposits] = useState<DepositTransaction[]>([]);
  const [filteredDeposits, setFilteredDeposits] = useState<DepositTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [activeTab, setActiveTab] = useState<string>("ALL");

  // Actions loading state
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Dispute modal state
  const [disputeId, setDisputeId] = useState<number | null>(null);
  const [disputeReason, setDisputeReason] = useState("ROOM_NOT_AS_DESCRIBED");
  const [disputeDesc, setDisputeDesc] = useState("");
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);

  // Review modal state
  const [reviewModal, setReviewModal] = useState<{ depositId: number; revieweeName: string } | null>(null);
  const [pendingReviewIds, setPendingReviewIds] = useState<Set<number>>(new Set());

  const fetchDeposits = async () => {
    setIsLoading(true);
    try {
      const response = await depositApi.getDeposits();
      if (response.success && response.data) {
        // Sort newest first
        const sorted = [...response.data].sort((a, b) => b.id - a.id);
        setDeposits(sorted);
      } else {
        setError(response.message || "Không thể tải lịch sử giao dịch.");
      }
    } catch (err: unknown) {
      console.error("Failed to load deposits:", err);
      const apiError = err as { response?: { data?: { message?: string } } };
      setError(apiError.response?.data?.message || "Lỗi tải dữ liệu. Vui lòng kiểm tra kết nối.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingReviews = async () => {
    try {
      const res = await transactionReviewApi.getMyPending();
      if (res.success && res.data) {
        setPendingReviewIds(new Set(res.data.map((p) => p.depositId)));
      }
    } catch {
      // không hiển thị lỗi cho người dùng — feature phụ
    }
  };

  useEffect(() => {
    if (authStatus === "authenticated") {
      setTimeout(() => fetchDeposits(), 0);
      setTimeout(() => fetchPendingReviews(), 0);
    } else if (authStatus === "unauthenticated") {
      setTimeout(() => setIsLoading(false), 0);
    }
  }, [authStatus]);

  useEffect(() => {
    if (activeTab === "ALL") {
      setTimeout(() => setFilteredDeposits(deposits), 0);
    } else {
      setTimeout(() => setFilteredDeposits(deposits.filter(d => d.status === activeTab)), 0);
    }
  }, [activeTab, deposits]);

  const handleConfirmMoveIn = async (id: number) => {
    if (!confirm("Bạn xác nhận đã nhận phòng thành công? Tiền cọc sẽ được giải ngân ngay lập tức cho chủ trọ.")) {
      return;
    }
    setProcessingId(id);
    try {
      const response = await depositApi.confirmMoveIn(id);
      if (response.success) {
        toast.success("Giải ngân tiền cọc thành công!");
        fetchDeposits();
      } else {
        toast.error(response.message || "Thao tác thất bại.");
      }
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || "Không thể thực hiện giải ngân.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeId) return;
    if (!disputeDesc.trim()) {
      toast.error("Vui lòng nhập mô tả chi tiết lý do tranh chấp.");
      return;
    }

    setIsSubmittingDispute(true);
    try {
      const response = await depositApi.openDispute(disputeId, {
        reason: disputeReason,
        description: disputeDesc.trim(),
        evidenceUrls: []
      });
      if (response.success) {
        toast.success("Đã mở tranh chấp thành công. Admin sẽ sớm liên hệ giải quyết.");
        setDisputeId(null);
        setDisputeDesc("");
        fetchDeposits();
      } else {
        toast.error(response.message || "Không thể gửi yêu cầu tranh chấp.");
      }
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || "Lỗi gửi tranh chấp.");
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  if (authStatus === "loading" || isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">Đang tải lịch sử đặt cọc...</p>
        </div>
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    return (
      <div className="container mx-auto py-20 px-4 text-center">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-md p-8 border">
          <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Vui lòng đăng nhập</h1>
          <p className="text-gray-500 text-sm mb-6">Bạn cần đăng nhập tài khoản RentSpace để xem lịch sử đặt cọc.</p>
          <Link href="/auth/login" className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-20 px-4 text-center">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-md p-8 border border-red-100">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Đã xảy ra lỗi</h1>
          <p className="text-red-500 text-sm mb-6">{error}</p>
          <button onClick={fetchDeposits} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const isTenant = session?.user?.role === "TENANT";

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lịch sử đặt cọc giữ chỗ</h1>
          <p className="text-sm text-gray-500">Quản lý giao dịch và trạng thái đặt cọc của bạn trên RentSpace.</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 px-4 py-2.5 rounded-xl flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <span className="text-xs text-emerald-800 font-semibold">Tất cả giao dịch được bảo vệ bởi Escrow</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 border-b border-gray-200">
        {[
          { key: "ALL", label: "Tất cả" },
          { key: "PENDING_PAYMENT", label: "Chờ thanh toán" },
          { key: "PAID", label: "Đã thanh toán (Escrow)" },
          { key: "DISPUTED", label: "Đang tranh chấp" },
          { key: "RELEASED", label: "Đã giải ngân" },
          { key: "REFUNDED", label: "Đã hoàn tiền" },
          { key: "CANCELLED", label: "Đã hủy" }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {filteredDeposits.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-150 p-16 text-center">
          <FileText className="h-16 w-16 text-gray-250 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-800 mb-1">Không có giao dịch nào</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            Không tìm thấy giao dịch đặt cọc nào có trạng thái phù hợp.
          </p>
        </div>
      ) : (
        /* Grid list */
        <div className="grid md:grid-cols-2 gap-6">
          {filteredDeposits.map((item) => {
            const statusInfo = STATUS_LABELS[item.status] || { label: item.status, bg: "bg-gray-100", text: "text-gray-700", icon: <HelpCircle /> };
            return (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-150 p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="space-y-4">
                  {/* Top Row: ID & Status */}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400 font-semibold">Giao dịch #{item.id}</span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${statusInfo.bg} ${statusInfo.text}`}>
                      {statusInfo.icon}
                      <span>{statusInfo.label}</span>
                    </span>
                  </div>

                  {/* Room Summary */}
                  <div>
                    <h3 className="text-base font-bold text-gray-900 line-clamp-1">
                      {item.listingTitle || `Tin đăng #${item.listingId}`}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">Ngày tạo: {formatDate(item.createdAt)}</p>
                  </div>

                  {/* Metadata Row */}
                  <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="space-y-1">
                      <span className="text-gray-400">Đối tác:</span>
                      <div className="flex items-center gap-1 text-gray-850 font-semibold">
                        <User className="h-3 w-3" />
                        <span>
                          {isTenant
                            ? (item.landlordName || `Chủ trọ #${item.landlordId}`)
                            : (item.tenantName || `Người thuê #${item.tenantId}`)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-400">Ngày nhận phòng:</span>
                      <div className="flex items-center gap-1 text-gray-850 font-semibold">
                        <Calendar className="h-3 w-3" />
                        <span>{item.moveInDate ? formatDate(item.moveInDate) : "Chưa chọn"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Money details */}
                  <div className="flex justify-between items-baseline border-t border-dashed border-gray-150 pt-3 text-sm">
                    <span className="text-gray-500">Tiền đặt cọc:</span>
                    <span className="text-lg font-extrabold text-blue-600">{formatPrice(item.amount)}</span>
                  </div>

                  {item.notes ? (
                    <div className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded-lg">
                      Ghi chú: &quot;{item.notes}&quot;
                    </div>
                  ) : null}
                </div>

                {/* Actions bottom */}
                <div className="mt-5 flex gap-2.5 border-t border-gray-100 pt-4">
                  {/* PENDING_PAYMENT action for Tenant */}
                  {item.status === "PENDING_PAYMENT" && isTenant && (
                    <Link
                      href={`/app/checkout/${item.id}`}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      <span>Thanh toán ngay</span>
                    </Link>
                  )}

                  {/* PAID actions for Tenant */}
                  {item.status === "PAID" && isTenant && (
                    <>
                      <button
                        onClick={() => handleConfirmMoveIn(item.id)}
                        disabled={processingId !== null}
                        className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 disabled:bg-gray-300 transition-colors cursor-pointer"
                      >
                        {processingId === item.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" />
                        ) : (
                          "Xác nhận nhận phòng"
                        )}
                      </button>
                      <button
                        onClick={() => setDisputeId(item.id)}
                        className="flex-1 border border-rose-350 text-rose-600 py-2 rounded-xl text-xs font-bold hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        Báo cáo tranh chấp
                      </button>
                    </>
                  )}

                  {/* Phase 4: Link đến trang hợp đồng kỹ thuật số mới */}
                  {(item.status === "PAID" || item.status === "RELEASED") && (
                    <Link
                      href={`/app/contracts/${item.id}`}
                      className="w-full border border-gray-200 text-gray-700 py-2 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Xem hợp đồng kỹ thuật số</span>
                    </Link>
                  )}

                  {/* Nút đánh giá — chỉ hiện khi RELEASED và chưa review */}
                  {item.status === "RELEASED" && pendingReviewIds.has(item.id) && (
                    <button
                      onClick={() => setReviewModal({
                        depositId: item.id,
                        revieweeName: isTenant
                          ? (item.landlordName || `Chủ trọ #${item.landlordId}`)
                          : (item.tenantName || `Người thuê #${item.tenantId}`)
                      })}
                      className="w-full flex items-center justify-center gap-1.5 border border-amber-300 bg-amber-50 text-amber-700 py-2 rounded-xl text-xs font-bold hover:bg-amber-100 transition-colors"
                    >
                      <Star className="h-3.5 w-3.5" />
                      <span>Đánh giá</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <ReviewModal
          open={true}
          depositId={reviewModal.depositId}
          revieweeName={reviewModal.revieweeName}
          onClose={() => {
            setReviewModal(null);
          }}
          onSuccess={() => {
            setPendingReviewIds((prev) => {
              const next = new Set(prev);
              next.delete(reviewModal.depositId);
              return next;
            });
            setReviewModal(null);
          }}
        />
      )}

      {/* Dispute Modal */}
      {disputeId !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] max-w-md w-full overflow-hidden border">
            <div className="bg-rose-50 px-6 py-4 border-b border-rose-100 flex items-center gap-2 text-rose-700">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-lg font-bold">Yêu cầu khiếu nại tranh chấp</h3>
            </div>
            <form onSubmit={handleDisputeSubmit} className="p-6 space-y-4">
              <p className="text-xs text-gray-500 leading-relaxed">
                RentSpace sẽ phong tỏa tiền đặt cọc và can thiệp điều tra. Vui lòng chọn lý do chính xác.
              </p>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Lý do khiếu nại
                </label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800"
                >
                  <option value="ROOM_NOT_AS_DESCRIBED">Phòng không đúng mô tả</option>
                  <option value="LANDLORD_NO_SHOW">Chủ nhà không xuất hiện bàn giao</option>
                  <option value="TENANT_NO_SHOW">Người thuê không đến nhận phòng</option>
                  <option value="OTHER">Lý do khác</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Mô tả chi tiết bằng chứng
                </label>
                <textarea
                  rows={4}
                  value={disputeDesc}
                  onChange={(e) => setDisputeDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800"
                  placeholder="Vui lòng cung cấp chi tiết sự việc..."
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDisputeId(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                  disabled={isSubmittingDispute}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDispute}
                  className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 disabled:bg-gray-300 flex items-center justify-center gap-1 cursor-pointer"
                >
                  {isSubmittingDispute && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Gửi khiếu nại</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
