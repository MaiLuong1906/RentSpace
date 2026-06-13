"use client";

import { useEffect, useState, useCallback } from "react";
import { usePayoutStore } from "@/store/payoutStore";
import { useSession } from "next-auth/react";
import { 
  CreditCard, 
  Building, 
  User, 
  Hash, 
  History, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  TrendingUp, 
  DollarSign,
  ArrowUpRight
} from "lucide-react";
import { toast } from "sonner";

interface AxiosErrorResponse {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
}

const POPULAR_BANKS = [
  { name: "Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)", code: "VCB" },
  { name: "Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank)", code: "TCB" },
  { name: "Ngân hàng TMCP Công Thương Việt Nam (VietinBank)", code: "CTG" },
  { name: "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)", code: "BIDV" },
  { name: "Ngân hàng TMCP Quân đội (MB Bank)", code: "MB" },
  { name: "Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)", code: "VPB" },
  { name: "Ngân hàng TMCP Á Châu (ACB)", code: "ACB" },
  { name: "Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)", code: "STB" },
  { name: "Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam (Agribank)", code: "VBA" }
];

export default function LandlordPayoutPage() {
  const { data: session, status: authStatus } = useSession();
  const {
    payoutAccount,
    payoutHistory,
    isLoading,
    fetchPayoutAccount,
    linkPayoutAccount,
    fetchPayoutHistory
  } = usePayoutStore();

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Form input state
  const [bankName, setBankName] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadPayoutHistory = useCallback(async (page: number) => {
    const res = await fetchPayoutHistory(page, 10);
    setCurrentPage(page);
    setTotalPages(res.totalPages);
    setTotalElements(res.totalElements);
  }, [fetchPayoutHistory]);

  useEffect(() => {
    if (authStatus === "authenticated" && session?.accessToken) {
      fetchPayoutAccount();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadPayoutHistory(0);
    }
  }, [authStatus, session?.accessToken, fetchPayoutAccount, loadPayoutHistory]);

  const handleBankSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCode = e.target.value;
    setBankCode(selectedCode);
    const bank = POPULAR_BANKS.find(b => b.code === selectedCode);
    if (bank) {
      setBankName(bank.name);
    } else {
      setBankName("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName || !bankCode || !accountNumber || !accountName) {
      toast.error("Vui lòng nhập đầy đủ thông tin tài khoản");
      return;
    }

    setIsSubmitting(true);
    try {
      await linkPayoutAccount({
        bankName,
        bankCode,
        accountNumber,
        accountName: accountName.toUpperCase().trim()
      });
      toast.success("Liên kết tài khoản ngân hàng thành công!");
      
      // Reset form fields
      setBankName("");
      setBankCode("");
      setAccountNumber("");
      setAccountName("");
      
      // Reload history (may contain backfill payouts)
      loadPayoutHistory(0);
    } catch (err: unknown) {
      const errorRes = err as AxiosErrorResponse;
      toast.error(errorRes.response?.data?.message || "Liên kết ngân hàng thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-50 text-green-700 border border-green-200 whitespace-nowrap">Thành công</span>;
      case "PENDING":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200 whitespace-nowrap">Chờ duyệt</span>;
      case "PROCESSING":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">Đang xử lý</span>;
      case "FAILED":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-200 whitespace-nowrap">Thất bại</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-50 text-gray-700 border border-gray-200 whitespace-nowrap">{status}</span>;
    }
  };

  if (authStatus === "loading" || (isLoading && !payoutHistory.length && !payoutAccount)) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Đang tải dữ liệu tài chính...</p>
      </div>
    );
  }

  // Calculate sum of completed payouts
  const totalReceived = payoutHistory
    .filter(p => p.status === "COMPLETED")
    .reduce((sum, current) => sum + current.netAmount, 0);

  const pendingPayoutsSum = payoutHistory
    .filter(p => p.status === "PENDING" || p.status === "PROCESSING")
    .reduce((sum, current) => sum + current.netAmount, 0);

  return (
    <div className="min-h-screen bg-gray-50/50 py-8">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Giải ngân & Tài khoản nhận tiền</h1>
          <p className="text-gray-600 mt-1">
            Quản lý tài khoản ngân hàng thụ hưởng và theo dõi lịch sử nhận tiền đặt cọc được giải ngân
          </p>
        </div>

        {/* Quick Analytics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all">
            <div>
              <span className="text-sm font-semibold text-gray-400">Đã nhận giải ngân</span>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalReceived)}</h3>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all">
            <div>
              <span className="text-sm font-semibold text-gray-400">Đang chờ xử lý</span>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(pendingPayoutsSum)}</h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all">
            <div>
              <span className="text-sm font-semibold text-gray-400">Tổng số yêu cầu giải ngân</span>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalElements} yêu cầu</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <ArrowUpRight className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
          {/* Card & Bank Account Setup */}
          <div className="lg:col-span-1 space-y-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Tài khoản ngân hàng
            </h3>

            {payoutAccount ? (
              /* Verified Bank Card representation */
              <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-5 shadow-xl border border-slate-700/50">
                <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-slate-400">Ngân hàng liên kết</span>
                    <h4 className="font-extrabold text-base tracking-tight mt-0.5">{payoutAccount.bankCode}</h4>
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-0.5 bg-green-500/20 backdrop-blur-md rounded-full text-[10px] font-semibold text-green-300 border border-green-500/30">
                    <CheckCircle2 className="h-3 w-3" />
                    Đã liên kết
                  </div>
                </div>

                <div className="mb-5">
                  <span className="text-[10px] text-slate-400 tracking-wider">SỐ TÀI KHOẢN</span>
                  <div className="text-lg font-mono tracking-wider mt-0.5">
                    {payoutAccount.accountNumber}
                  </div>
                </div>

                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-xs text-slate-400 tracking-wider">CHỦ TÀI KHOẢN</span>
                    <div className="font-bold tracking-wide uppercase mt-1">{payoutAccount.accountName}</div>
                  </div>
                  <div className="text-xs text-slate-400">
                    {payoutAccount.bankName.length > 25 
                      ? payoutAccount.bankName.substring(0, 25) + "..." 
                      : payoutAccount.bankName}
                  </div>
                </div>
              </div>
            ) : (
              /* If no bank card setup, display educational alert */
              <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-2xl text-amber-800 shadow-sm flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-900">Chưa liên kết tài khoản ngân hàng</h4>
                  <p className="text-sm text-amber-700 mt-1 leading-relaxed">
                    Bạn cần liên kết tài khoản ngân hàng để hệ thống tự động giải ngân tiền cọc (Escrow) ngay khi khách hàng xác nhận nhận phòng hoặc khi có phán quyết tranh chấp có lợi cho bạn.
                  </p>
                </div>
              </div>
            )}

            {/* Linking/Updating bank form */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4.5 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-sm">
                <Building className="h-4 w-4 text-blue-600" />
                {payoutAccount ? "Cập nhật tài khoản" : "Cấu hình tài khoản nhận tiền"}
              </h4>
              
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Ngân hàng nhận tiền
                  </label>
                  <select
                    value={bankCode}
                    onChange={handleBankSelect}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="">-- Chọn ngân hàng nhận tiền --</option>
                    {POPULAR_BANKS.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.code} - {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Số tài khoản ngân hàng
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Nhập số tài khoản"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Tên chủ tài khoản (Không dấu)
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Ví dụ: NGUYEN VAN A"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white font-bold text-xs py-2.5 px-4 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang thực hiện...
                    </>
                  ) : (
                    payoutAccount ? "Cập nhật liên kết" : "Liên kết tài khoản"
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Payout history Table */}
          <div className="lg:col-span-3 space-y-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <History className="h-5 w-5 text-blue-600" />
              Lịch sử giao dịch nhận tiền giải ngân
            </h3>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Chi tiết giao dịch đặt cọc</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right whitespace-nowrap">Số tiền gốc</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right whitespace-nowrap">Thực nhận (Net)</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Trạng thái</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Thông tin chuyển khoản</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {payoutHistory.length > 0 ? (
                      payoutHistory.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-gray-900 max-w-[260px] truncate">{p.listingTitle}</div>
                            <div className="text-xs text-gray-400 mt-1">Giao dịch cọc: #{p.depositId}</div>
                            <div className="text-xs text-gray-400 mt-0.5">Thời gian: {new Date(p.createdAt).toLocaleDateString("vi-VN")}</div>
                          </td>
                          <td className="px-4 py-3.5 text-right font-medium text-gray-500 whitespace-nowrap">
                            {formatCurrency(p.amount)}
                          </td>
                          <td className="px-4 py-3.5 text-right font-bold text-gray-900 whitespace-nowrap">
                            {formatCurrency(p.netAmount)}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            {getStatusBadge(p.status)}
                          </td>
                          <td className="px-4 py-3.5">
                            {p.status === "COMPLETED" ? (
                              <div className="text-xs">
                                <div className="font-bold text-slate-800">Ref: {p.bankRef || "N/A"}</div>
                                <div className="text-slate-500 mt-0.5">{p.note || "Đã giải ngân"}</div>
                              </div>
                            ) : p.status === "FAILED" ? (
                              <div className="text-xs text-red-600">
                                <div>Lỗi: {p.note || "Giải ngân thất bại"}</div>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 italic">Đang trong tiến trình đối soát</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-gray-400">
                          Không tìm thấy lịch sử giao dịch giải ngân nào.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center px-4 py-3.5 border-t border-gray-150">
                  <span className="text-sm text-gray-500 font-medium">
                    Trang {currentPage + 1} / {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={currentPage === 0}
                      onClick={() => loadPayoutHistory(currentPage - 1)}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none transition-all"
                    >
                      Trước
                    </button>
                    <button
                      disabled={currentPage === totalPages - 1}
                      onClick={() => loadPayoutHistory(currentPage + 1)}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none transition-all"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
