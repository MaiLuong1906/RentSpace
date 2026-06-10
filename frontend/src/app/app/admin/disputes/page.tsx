"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { depositApi } from "@/lib/api/deposit.api";
import { DisputeResponse } from "@/types/phase2.types";
import { 
  ShieldAlert, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  User, 
  FileText, 
  X, 
  Scale, 
  MessageSquare,
  BadgeAlert,
  Inbox,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const STATUS_CONFIG: Record<DisputeResponse["status"], { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  OPEN: { label: "Mới mở", bg: "bg-rose-50 border-rose-200", text: "text-rose-700", icon: <AlertCircle className="h-4 w-4" /> },
  UNDER_REVIEW: { label: "Đang xem xét", bg: "bg-amber-50 border-amber-250", text: "text-amber-700", icon: <BadgeAlert className="h-4 w-4" /> },
  RESOLVED_TENANT: { label: "Hoàn tiền cho Người thuê", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", icon: <CheckCircle2 className="h-4 w-4" /> },
  RESOLVED_LANDLORD: { label: "Giải ngân cho Chủ nhà", bg: "bg-blue-50 border-blue-200", text: "text-blue-700", icon: <CheckCircle2 className="h-4 w-4" /> },
  RESOLVED_PLATFORM: { label: "Phân quyết khác / Đóng", bg: "bg-purple-50 border-purple-200", text: "text-purple-700", icon: <CheckCircle2 className="h-4 w-4" /> },
};

const REASON_LABELS: Record<DisputeResponse["reason"], string> = {
  ROOM_NOT_AS_DESCRIBED: "Phòng không đúng như mô tả trên tin đăng",
  LANDLORD_NO_SHOW: "Chủ nhà không xuất hiện bàn giao phòng",
  TENANT_NO_SHOW: "Người thuê không đến nhận phòng",
  OTHER: "Lý do khác",
};

export default function AdminDisputesPage() {
  const { data: session, status: authStatus } = useSession();
  const fetchedRef = useRef(false);
  const [disputes, setDisputes] = useState<DisputeResponse[]>([]);
  const [filteredDisputes, setFilteredDisputes] = useState<DisputeResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tabs: 'ALL' | 'PENDING' | 'RESOLVED'
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'RESOLVED'>('ALL');

  // Selected dispute for detail / resolution modal
  const [selectedDispute, setSelectedDispute] = useState<DisputeResponse | null>(null);
  
  // Resolution form state
  const [resolution, setResolution] = useState<'RESOLVED_TENANT' | 'RESOLVED_LANDLORD' | 'RESOLVED_PLATFORM'>('RESOLVED_TENANT');
  const [resolutionNote, setResolutionNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDisputes = async () => {
    setIsLoading(true);
    try {
      const response = await depositApi.adminGetAllDisputes();
      if (response.success && response.data) {
        // Sort by ID descending
        const sorted = [...response.data].sort((a, b) => b.id - a.id);
        setDisputes(sorted);
      } else {
        setError(response.message || "Không thể tải danh sách khiếu nại.");
      }
    } catch (err: unknown) {
      console.error("Failed to load admin disputes:", err);
      const apiError = err as { response?: { data?: { message?: string } } };
      setError(apiError.response?.data?.message || "Lỗi hệ thống khi tải danh sách tranh chấp.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authStatus === "authenticated" && session?.user?.role === "ADMIN" && !fetchedRef.current) {
      fetchedRef.current = true;
      setTimeout(() => fetchDisputes(), 0);
    } else if (authStatus === "unauthenticated" || (authStatus === "authenticated" && session?.user?.role !== "ADMIN")) {
      setTimeout(() => setIsLoading(false), 0);
    }
  }, [authStatus, session]);

  useEffect(() => {
    if (activeTab === 'ALL') {
      setTimeout(() => setFilteredDisputes(disputes), 0);
    } else if (activeTab === 'PENDING') {
      setTimeout(() => setFilteredDisputes(disputes.filter(d => d.status === 'OPEN' || d.status === 'UNDER_REVIEW')), 0);
    } else {
      setTimeout(() => setFilteredDisputes(disputes.filter(d => d.status.startsWith('RESOLVED'))), 0);
    }
  }, [activeTab, disputes]);

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute) return;
    if (!resolutionNote.trim()) {
      toast.error("Vui lòng nhập ghi chú phán quyết chi tiết.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await depositApi.adminResolveDispute(
        selectedDispute.id,
        resolution,
        resolutionNote.trim()
      );
      if (response.success) {
        toast.success("Đã ban hành phán quyết giải quyết tranh chấp!");
        setSelectedDispute(null);
        setResolutionNote("");
        fetchDisputes();
      } else {
        toast.error(response.message || "Xử lý phán quyết thất bại.");
      }
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || "Lỗi xử lý phán quyết.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (authStatus === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">Đang tải danh sách khiếu nại tranh chấp...</p>
        </div>
      </div>
    );
  }

  if (authStatus === "unauthenticated" || session?.user?.role !== "ADMIN") {
    return (
      <div className="min-h-[80vh] bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-gray-150 rounded-3xl p-8 text-center shadow-lg">
          <ShieldAlert className="h-14 w-14 text-red-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-extrabold text-gray-800 mb-2">Quyền truy cập bị giới hạn</h2>
          <p className="text-gray-500 text-sm mb-6">
            Bạn cần đăng nhập bằng tài khoản Quản trị viên (ADMIN) để truy cập trang này.
          </p>
          <Link href="/" className="inline-block bg-gray-900 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-gray-800 transition-colors">
            Trở về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-10">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Back and Title */}
        <div className="mb-8 space-y-4">
          <Link href="/app/admin" className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Quay lại Dashboard</span>
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                <Scale className="h-7 w-7 text-amber-600" />
                <span>Trọng tài Giải quyết Tranh chấp</span>
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Xem xét bằng chứng, thông tin giao dịch và thực hiện phán quyết phân xử hoàn trả hoặc giải ngân đặt cọc.
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl text-xs font-bold text-amber-800 flex items-center gap-1.5 self-start md:self-center">
              <Scale className="h-4 w-4" />
              <span>Thẩm quyền giải quyết Escrow</span>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error ? (
          <div className="bg-white rounded-2xl border border-red-100 p-8 text-center max-w-md mx-auto shadow-sm">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-800 mb-1">Đã xảy ra lỗi</h3>
            <p className="text-red-500 text-sm mb-5">{error}</p>
            <button onClick={fetchDisputes} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-700">
              Thử lại
            </button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 pb-3 mb-6">
              {[
                { key: 'ALL', label: `Tất cả (${disputes.length})` },
                { key: 'PENDING', label: `Chờ xử lý (${disputes.filter(d => d.status === 'OPEN' || d.status === 'UNDER_REVIEW').length})` },
                { key: 'RESOLVED', label: `Đã giải quyết (${disputes.filter(d => d.status.startsWith('RESOLVED')).length})` }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as 'ALL' | 'PENDING' | 'RESOLVED')}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                    activeTab === tab.key
                      ? "bg-amber-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content List */}
            {filteredDisputes.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-150 p-16 text-center shadow-sm">
                <Inbox className="h-16 w-16 text-gray-250 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-800 mb-1">Không tìm thấy khiếu nại nào</h3>
                <p className="text-gray-500 text-sm max-w-sm mx-auto">
                  Hiện tại không có tranh chấp nào khớp với bộ lọc đã chọn.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDisputes.map((item) => {
                  const statusInfo = STATUS_CONFIG[item.status] || { label: item.status, bg: "bg-gray-100", text: "text-gray-700", icon: <AlertCircle /> };
                  const isClosed = item.status.startsWith('RESOLVED');

                  return (
                    <div key={item.id} className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-3.5 flex-1">
                        {/* Top: ID & status */}
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 font-bold">Khiếu nại #{item.id}</span>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusInfo.bg} ${statusInfo.text}`}>
                            {statusInfo.icon}
                            <span>{statusInfo.label}</span>
                          </span>
                        </div>

                        {/* Mid details */}
                        <div>
                          <h3 className="text-base font-extrabold text-gray-900">
                            {REASON_LABELS[item.reason] || item.reason}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2 bg-gray-55 p-3 rounded-xl border border-gray-100 italic">
                            &quot;{item.description}&quot;
                          </p>
                        </div>

                        {/* Metadata row */}
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            <span>Mở bởi User ID: <strong>{item.openedById}</strong> ({item.openedByName || "Ẩn danh"})</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Ngày mở: {formatDate(item.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5" />
                            <span>Giao dịch liên kết ID: <strong>#{item.transactionId}</strong></span>
                          </div>
                        </div>

                        {/* Resolution details if resolved */}
                        {isClosed && (
                          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 text-xs space-y-1.5">
                            <div className="font-bold text-emerald-800 flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Quyết định phân xử của Ban quản trị:</span>
                            </div>
                            <p className="text-gray-700 leading-relaxed font-semibold">
                              &quot;{item.resolutionNote}&quot;
                            </p>
                            <div className="text-gray-400 mt-1 flex gap-2">
                              <span>Phân xử bởi: <strong>{item.resolvedByName || `Admin #${item.resolvedById}`}</strong></span>
                              <span>•</span>
                              <span>Ngày: {item.resolvedAt ? formatDate(item.resolvedAt) : "N/A"}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-row md:flex-col gap-2.5 justify-end self-start md:self-center">
                        {!isClosed && (
                          <button
                            onClick={() => {
                              setSelectedDispute(item);
                              setResolution('RESOLVED_TENANT');
                            }}
                            className="bg-amber-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-amber-700 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                          >
                            <Scale className="h-4 w-4" />
                            <span>Xem xét & Phán quyết</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Judge Modal */}
        {selectedDispute && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full overflow-hidden border border-gray-150 animate-in fade-in zoom-in-95 duration-150">
              <div className="bg-amber-50 px-6 py-4 border-b border-amber-100 flex items-center justify-between text-amber-800">
                <div className="flex items-center gap-2 font-black text-lg">
                  <Scale className="h-5 w-5 text-amber-600" />
                  <h3>Phán quyết khiếu nại #{selectedDispute.id}</h3>
                </div>
                <button onClick={() => setSelectedDispute(null)} className="text-gray-400 hover:text-gray-700 p-1">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleResolveSubmit} className="p-6 space-y-5">
                {/* Dispute Summary info */}
                <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl space-y-2 text-xs">
                  <div>
                    <span className="text-gray-400 font-bold uppercase block mb-0.5">Lý do khiếu nại</span>
                    <span className="font-extrabold text-gray-800 text-sm">
                      {REASON_LABELS[selectedDispute.reason] || selectedDispute.reason}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold uppercase block mb-0.5">Nội dung giải trình</span>
                    <p className="text-gray-700 text-sm italic">&quot;{selectedDispute.description}&quot;</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-t pt-2 mt-2">
                    <span>Mã giao dịch: <strong>#{selectedDispute.transactionId}</strong></span>
                    <span>Bởi User ID: <strong>{selectedDispute.openedById}</strong></span>
                  </div>
                </div>

                {/* Judge Resolution Radio buttons */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                    Lựa chọn Phán quyết
                  </label>
                  <div className="grid grid-cols-1 gap-2.5">
                    {[
                      { key: 'RESOLVED_TENANT' as const, title: 'Hoàn trả tiền cọc cho Người thuê', desc: 'Hủy giao dịch đặt cọc và trả lại tiền cho người thuê. Sử dụng khi chủ nhà vi phạm bàn giao.' },
                      { key: 'RESOLVED_LANDLORD' as const, title: 'Giải ngân tiền cọc cho Chủ nhà', desc: 'Đồng ý chuyển tiền đặt cọc cho chủ nhà trọ. Sử dụng khi người thuê từ chối nhận phòng vô lý.' },
                      { key: 'RESOLVED_PLATFORM' as const, title: 'Phán quyết khác / Đóng tranh chấp', desc: 'Đóng yêu cầu tranh chấp mà không thực hiện hoàn trả/giải ngân tự động (hoặc phân chia thủ công).' }
                    ].map((opt) => (
                      <label
                        key={opt.key}
                        className={`flex gap-3 p-3.5 border rounded-2xl cursor-pointer transition-all ${
                          resolution === opt.key
                            ? "bg-amber-50/50 border-amber-300 ring-2 ring-amber-100"
                            : "border-gray-250 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="resolution"
                          value={opt.key}
                          checked={resolution === opt.key}
                          onChange={() => setResolution(opt.key)}
                          className="mt-0.5 accent-amber-600"
                        />
                        <div className="text-xs">
                          <span className="font-extrabold text-gray-950 block text-sm">{opt.title}</span>
                          <span className="text-gray-500 leading-normal mt-0.5 block">{opt.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Ghi chú */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                    Ghi chú chi tiết phán quyết (Bắt buộc)
                  </label>
                  <textarea
                    rows={3}
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Nêu rõ lý do ra phán quyết và các bằng chứng đã xem xét..."
                    required
                  />
                  <p className="text-[10px] text-gray-400 mt-1 italic">
                    * Quyết định phán quyết sẽ ngay lập tức thay đổi số dư và được thông báo tới cả hai bên.
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDispute(null)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50"
                    disabled={isSubmitting}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 disabled:bg-gray-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>Ban hành Phán quyết</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
