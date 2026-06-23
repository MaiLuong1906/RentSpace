"use client";

import { useEffect, useState, useCallback } from "react";
import { usePayoutStore } from "@/store/payoutStore";
import { useSession } from "next-auth/react";
import { 
  ShieldCheck, 
  Building, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2, 
  AlertCircle,
  X
} from "lucide-react";
import { PayoutStatus, PayoutTransaction } from "@/types/payout.types";
import { toast } from "sonner";

interface AxiosErrorResponse {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
}

export default function AdminPayoutsPage() {
  const { data: session, status: authStatus } = useSession();
  const {
    adminPayouts,
    isLoading,
    fetchAdminPayouts,
    processPayout
  } = usePayoutStore();

  // Tab Status
  const [activeTab, setActiveTab] = useState<PayoutStatus>("PENDING");

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Modal / Inline process state
  const [selectedPayout, setSelectedPayout] = useState<PayoutTransaction | null>(null);
  const [processStatus, setProcessStatus] = useState<PayoutStatus>("COMPLETED");
  const [bankRef, setBankRef] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadPayouts = useCallback(async (status: PayoutStatus, page: number) => {
    const res = await fetchAdminPayouts(status, page, 10);
    setCurrentPage(page);
    setTotalPages(res.totalPages);
    setTotalElements(res.totalElements);
  }, [fetchAdminPayouts]);

  useEffect(() => {
    if (authStatus === "authenticated" && session?.user?.role === "ADMIN") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadPayouts(activeTab, 0);
    }
  }, [authStatus, session?.user?.role, activeTab, loadPayouts]);

  const handleProcessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayout) return;

    if (processStatus === "COMPLETED" && !bankRef.trim()) {
      toast.error("Vui lòng cung cấp Mã giao dịch ngân hàng đối soát");
      return;
    }

    setIsSubmitting(true);
    try {
      await processPayout(selectedPayout.id, {
        status: processStatus,
        bankRef: bankRef.trim(),
        note: note.trim()
      });
      toast.success("Xử lý yêu cầu giải ngân thành công!");
      setSelectedPayout(null);
      setBankRef("");
      setNote("");
      // Reload current list
      loadPayouts(activeTab, currentPage);
    } catch (err: unknown) {
      const errorRes = err as AxiosErrorResponse;
      toast.error(errorRes.response?.data?.message || "Xử lý giải ngân thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
  };

  const getStatusTabClass = (tab: PayoutStatus) => {
    const base = "px-5 py-3 rounded-xl text-sm font-bold transition-all border";
    if (activeTab === tab) {
      switch (tab) {
        case "PENDING":
          return `${base} bg-yellow-50 text-yellow-800 border-yellow-200 shadow-sm`;
        case "COMPLETED":
          return `${base} bg-green-50 text-green-800 border-green-200 shadow-sm`;
        case "FAILED":
          return `${base} bg-red-50 text-red-800 border-red-200 shadow-sm`;
        default:
          return `${base} bg-blue-50 text-blue-800 border-blue-200 shadow-sm`;
      }
    }
    return `${base} bg-white text-gray-500 border-gray-100 hover:bg-gray-50`;
  };

  if (authStatus === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Đang tải trang đối soát tài chính...</p>
      </div>
    );
  }

  if (authStatus === "unauthenticated" || session?.user?.role !== "ADMIN") {
    return (
      <div className="min-h-[85vh] bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-2xl max-w-md w-full shadow-md text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <h3 className="font-bold text-red-900 text-lg mb-1">Truy cập bị giới hạn</h3>
          <p className="text-red-700 text-sm">
            Tài khoản của bạn không có đặc quyền quản trị viên (ADMIN) để xem thông tin trang quản trị đối soát giải ngân.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="h-8 w-8 text-blue-600" />
              Đối soát Giải ngân Escrow
            </h1>
            <p className="text-gray-600 mt-1">
              Phê duyệt các yêu cầu chuyển tiền từ tài khoản Escrow của RentSpace đến tài khoản ngân hàng của chủ nhà
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button onClick={() => setActiveTab("PENDING")} className={getStatusTabClass("PENDING")}>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Chờ xử lý ({activeTab === "PENDING" ? totalElements : "..."})
            </span>
          </button>
          <button onClick={() => setActiveTab("COMPLETED")} className={getStatusTabClass("COMPLETED")}>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Đã thành công ({activeTab === "COMPLETED" ? totalElements : "..."})
            </span>
          </button>
          <button onClick={() => setActiveTab("FAILED")} className={getStatusTabClass("FAILED")}>
            <span className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Thất bại ({activeTab === "FAILED" ? totalElements : "..."})
            </span>
          </button>
        </div>

        {/* Admin Payouts List */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Chủ nhà thụ hưởng</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tài khoản nhận tiền</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Chi tiết giao dịch gốc</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Số tiền giải ngân</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Phí & Thuế</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Thực chuyển (Net)</th>
                  {activeTab !== "PENDING" && (
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Thông tin đối soát</th>
                  )}
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12">
                      <div className="flex items-center justify-center gap-2 text-gray-400">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Đang tải dữ liệu giải ngân...
                      </div>
                    </td>
                  </tr>
                ) : adminPayouts.length > 0 ? (
                  adminPayouts.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{p.landlordName}</div>
                        <div className="text-xs text-gray-400 mt-0.5">ID: {p.landlordId}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <Building className="h-3.5 w-3.5 text-gray-400" />
                          {p.bankCode}
                        </div>
                        <div className="text-sm font-mono mt-0.5">{p.accountNumber}</div>
                        <div className="text-xs text-gray-400 uppercase mt-0.5">{p.accountName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800 max-w-[150px] truncate">{p.listingTitle}</div>
                        <div className="text-xs text-gray-400 mt-0.5">Đặt cọc ID: #{p.depositId}</div>
                        <div className="text-xs text-gray-400 mt-0.5">Ngày tạo: {new Date(p.createdAt).toLocaleDateString("vi-VN")}</div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-600">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-red-500">
                        {formatCurrency(p.fee)}
                      </td>
                      <td className="px-6 py-4 text-right font-extrabold text-blue-900">
                        {formatCurrency(p.netAmount)}
                      </td>
                      {activeTab !== "PENDING" && (
                        <td className="px-6 py-4">
                          <div className="text-xs">
                            <div className="font-bold text-slate-900">Ref: {p.bankRef || "N/A"}</div>
                            <div className="text-slate-500 mt-0.5">{p.note || "N/A"}</div>
                            {p.processedAt && (
                              <div className="text-slate-400 mt-0.5">Xử lý: {new Date(p.processedAt).toLocaleString("vi-VN")}</div>
                            )}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 text-center">
                        {p.status === "PENDING" || p.status === "PROCESSING" ? (
                          <button
                            onClick={() => {
                              setSelectedPayout(p);
                              setProcessStatus("COMPLETED");
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm"
                          >
                            Xử lý chuyển khoản
                          </button>
                        ) : p.status === "COMPLETED" ? (
                          <span className="inline-flex items-center gap-1 text-green-600 text-xs font-bold">
                            <CheckCircle2 className="h-4 w-4" /> Hoàn thành
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600 text-xs font-bold">
                            <XCircle className="h-4 w-4" /> Đã từ chối
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-gray-400 font-medium">
                      Không có yêu cầu giải ngân nào trong mục này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-6 py-4 border-t border-gray-150">
              <span className="text-sm text-gray-500 font-medium">
                Trang {currentPage + 1} / {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 0}
                  onClick={() => loadPayouts(activeTab, currentPage - 1)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none transition-all"
                >
                  Trước
                </button>
                <button
                  disabled={currentPage === totalPages - 1}
                  onClick={() => loadPayouts(activeTab, currentPage + 1)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none transition-all"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Payout Processing Dialog Modal */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 transition-all">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-extrabold text-gray-900 text-lg">Xử lý yêu cầu giải ngân #{selectedPayout.id}</h3>
              <button 
                onClick={() => setSelectedPayout(null)}
                className="p-1.5 bg-gray-100 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleProcessSubmit} className="p-6 space-y-5">
              {/* Landlord & Banking Summary */}
              <div className="bg-blue-50/50 border border-blue-100/50 rounded-2xl p-4 text-sm space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-semibold">Chủ nhà thụ hưởng:</span>
                  <span className="font-bold text-slate-800">{selectedPayout.landlordName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-semibold">Tài khoản đích:</span>
                  <span className="font-bold text-slate-800">
                    {selectedPayout.bankCode} - {selectedPayout.accountNumber} ({selectedPayout.accountName})
                  </span>
                </div>
                <div className="flex justify-between border-t border-blue-100/30 pt-2.5">
                  <span className="text-gray-500 font-semibold">Thực chuyển (Net):</span>
                  <span className="font-extrabold text-blue-900 text-base">{formatCurrency(selectedPayout.netAmount)}</span>
                </div>
              </div>

              {/* Status Action Option */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Quyết định phê duyệt
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setProcessStatus("COMPLETED")}
                    className={`py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border transition-all ${
                      processStatus === "COMPLETED" 
                        ? "bg-green-50 text-green-800 border-green-200 shadow-sm"
                        : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Chấp thuận giải ngân
                  </button>
                  <button
                    type="button"
                    onClick={() => setProcessStatus("FAILED")}
                    className={`py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border transition-all ${
                      processStatus === "FAILED" 
                        ? "bg-red-50 text-red-800 border-red-200 shadow-sm"
                        : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <XCircle className="h-4 w-4" />
                    Từ chối giải ngân
                  </button>
                </div>
              </div>

              {/* Bank Transaction Ref */}
              {processStatus === "COMPLETED" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Mã giao dịch ngân hàng đối soát (Bank Reference Code) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: FT26164987654"
                    value={bankRef}
                    onChange={(e) => setBankRef(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              )}

              {/* Note / Comment */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {processStatus === "COMPLETED" ? "Ghi chú giải ngân" : "Lý do từ chối"}
                </label>
                <textarea
                  rows={3}
                  placeholder={processStatus === "COMPLETED" ? "Nhập ghi chú chuyển tiền..." : "Nêu rõ lý do từ chối yêu cầu..."}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedPayout(null)}
                  className="px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 bg-white hover:bg-gray-50 transition-all"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5 shadow-md shadow-blue-500/10"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    "Xác nhận hoàn thành"
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
