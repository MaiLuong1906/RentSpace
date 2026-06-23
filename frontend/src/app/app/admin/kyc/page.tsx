"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { CheckCircle, XCircle, Eye, ShieldAlert, RefreshCw, Calendar, Mail, User, AlertCircle } from "lucide-react";
import { kycApi } from "@/lib/api/kyc.api";
import { KycReviewItem } from "@/types/kyc.types";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminKYCPage() {
  const { data: session, status: authStatus } = useSession();
  const fetchedRef = useRef(false);
  
  const [submissions, setSubmissions] = useState<KycReviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<KycReviewItem | null>(null);
  
  // Trạng thái từ chối (Reject)
  const [isRejectMode, setIsRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Tải danh sách KYC đang chờ duyệt từ Backend
  const fetchPendingSubmissions = async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      const res = await kycApi.getPendingList();
      if (res.success && res.data) {
        setSubmissions(res.data);
      } else {
        toast.error("Không thể tải danh sách KYC chờ duyệt.");
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách KYC admin:", error);
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
        fetchPendingSubmissions();
      } else if (!session?.accessToken) {
        const timer = setTimeout(() => {
          setLoading(false);
        }, 1500);
        return () => clearTimeout(timer);
      }
    } else if (authStatus === "unauthenticated") {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, authStatus]);

  // Phê duyệt KYC
  const handleApprove = async (userId: number) => {
    setActionLoading(true);
    try {
      const res = await kycApi.approveKyc(userId);
      if (res.success) {
        toast.success(`Đã phê duyệt KYC thành công cho người dùng!`);
        setSelectedSubmission(null);
        await fetchPendingSubmissions(); // Tải lại danh sách
      } else {
        toast.error(res.message || "Không thể phê duyệt KYC.");
      }
    } catch (error) {
      console.error("Lỗi phê duyệt:", error);
      toast.error("Lỗi kết nối máy chủ khi phê duyệt.");
    } finally {
      setActionLoading(false);
    }
  };

  // Từ chối KYC
  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;
    if (!rejectReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await kycApi.rejectKyc(selectedSubmission.userId, rejectReason.trim());
      if (res.success) {
        toast.success("Đã từ chối hồ sơ KYC thành công.");
        setSelectedSubmission(null);
        setIsRejectMode(false);
        setRejectReason("");
        await fetchPendingSubmissions(); // Tải lại danh sách
      } else {
        toast.error(res.message || "Không thể từ chối KYC.");
      }
    } catch (error) {
      console.error("Lỗi từ chối KYC:", error);
      toast.error("Lỗi kết nối khi gửi yêu cầu từ chối.");
    } finally {
      setActionLoading(false);
    }
  };

  // Trạng thái tải dữ liệu
  if (loading || authStatus === "loading") {
    return (
      <div className="min-h-screen bg-gray-50/50 py-12 flex flex-col items-center justify-center">
        <RefreshCw className="h-10 w-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 text-sm font-semibold">Đang tải danh sách hồ sơ KYC...</p>
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
            Bạn cần đăng nhập tài khoản có quyền quản trị viên (ADMIN) để xem trang quản trị duyệt KYC này.
          </p>
          <Link
            href="/"
            className="block w-full bg-gray-900 text-white py-3 rounded-2xl font-bold hover:bg-gray-800 transition-all text-sm"
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">
              Xét duyệt hồ sơ KYC
            </h1>
            <p className="text-xs text-gray-400 font-medium mt-1">Danh sách hồ sơ khách hàng đang chờ thẩm định từ bạn</p>
          </div>
          <button
            onClick={fetchPendingSubmissions}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Làm mới danh sách</span>
          </button>
        </div>

        {/* Bảng hồ sơ KYC */}
        <div className="bg-white border border-gray-100 rounded-3xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4.5 text-xs font-extrabold text-gray-400 uppercase tracking-wider">Người dùng</th>
                  <th className="px-6 py-4.5 text-xs font-extrabold text-gray-400 uppercase tracking-wider">Mục đích</th>
                  <th className="px-6 py-4.5 text-xs font-extrabold text-gray-400 uppercase tracking-wider">Ngày nộp hồ sơ</th>
                  <th className="px-6 py-4.5 text-right text-xs font-extrabold text-gray-400 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {submissions.map((submission) => (
                  <tr key={submission.userId} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 border border-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-extrabold text-gray-800 text-sm">{submission.fullName}</div>
                          <div className="text-xs text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3" />
                            <span>{submission.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex px-3 py-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded-full">
                        Xác minh tài khoản
                      </span>
                    </td>
                    <td className="px-6 py-5 text-gray-600">
                      <div className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <span>{new Date(submission.submittedAt).toLocaleDateString("vi-VN")}</span>
                      </div>
                      <div className="text-xs text-gray-400 font-medium mt-0.5">
                        {new Date(submission.submittedAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={() => {
                          setSelectedSubmission(submission);
                          setIsRejectMode(false);
                          setRejectReason("");
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 border border-blue-100 hover:bg-blue-100/70 text-blue-700 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Thẩm định chi tiết</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {submissions.length === 0 && (
            <div className="text-center py-16 px-4 bg-gray-50/20">
              <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-700 mb-1">Không có hồ sơ nào cần duyệt</h3>
              <p className="text-xs text-gray-400">Toàn bộ hồ sơ xác minh KYC từ người dùng đã được xử lý xong.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Thẩm định Chi tiết (Admin Review Modal) */}
      <AnimatePresence>
        {selectedSubmission && (
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
                  <h2 className="text-xl font-extrabold text-gray-800">Thẩm định hồ sơ khách hàng</h2>
                  <p className="text-xs text-gray-400 font-medium">Đối chiếu hình ảnh thực tế của Căn cước công dân</p>
                </div>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              {/* Body Modal */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* Thông tin User */}
                <div>
                  <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2.5">Thông tin đối tượng</h3>
                  <div className="grid sm:grid-cols-2 gap-4 bg-gray-50 border border-gray-100 p-4.5 rounded-2xl">
                    <div className="flex items-center gap-2.5">
                      <User className="h-4.5 w-4.5 text-gray-400" />
                      <div>
                        <span className="text-[10px] text-gray-400 block font-bold">Họ và tên</span>
                        <span className="text-sm font-extrabold text-gray-700">{selectedSubmission.fullName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Mail className="h-4.5 w-4.5 text-gray-400" />
                      <div>
                        <span className="text-[10px] text-gray-400 block font-bold">Địa chỉ Email</span>
                        <span className="text-sm font-extrabold text-gray-700 break-all">{selectedSubmission.email}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hình ảnh CCCD */}
                <div>
                  <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-3">Tệp tin ảnh CCCD</h3>
                  <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-inner bg-gray-50 max-w-md mx-auto">
                    <p className="text-xs text-gray-600 font-bold p-3 bg-gray-100/50 border-b border-gray-100 flex items-center justify-between">
                      <span>Ảnh chụp mặt trước</span>
                      <a
                        href={selectedSubmission.cccdImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-blue-600 hover:underline"
                      >
                        Mở ảnh gốc ↗
                      </a>
                    </p>
                    <img
                      src={selectedSubmission.cccdImageUrl}
                      alt="Ảnh chụp CCCD của người dùng"
                      className="w-full max-h-64 object-contain p-2"
                    />
                  </div>
                </div>

                {/* Form nhập lý do từ chối */}
                {isRejectMode && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    onSubmit={handleRejectSubmit}
                    className="p-4 bg-rose-50 border border-rose-100 rounded-2xl space-y-3"
                  >
                    <label htmlFor="reason" className="block text-xs font-bold text-rose-950">
                      Lý do từ chối hồ sơ (Gửi trực tiếp đến User):
                    </label>
                    <textarea
                      id="reason"
                      rows={3}
                      required
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Hình ảnh bị mờ, lóa đèn flash, bị mất góc không thấy rõ thông tin..."
                      className="w-full p-3 border border-rose-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 bg-white text-sm"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setIsRejectMode(false)}
                        className="px-4 py-2 border border-rose-200 hover:bg-rose-100/40 text-rose-700 rounded-xl text-xs font-bold transition-all"
                      >
                        Quay lại
                      </button>
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/10 flex items-center gap-1 disabled:opacity-50"
                      >
                        {actionLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                        <span>Từ chối hồ sơ</span>
                      </button>
                    </div>
                  </motion.form>
                )}
              </div>

              {/* Footer Modal Actions */}
              {!isRejectMode && (
                <div className="p-6 border-t border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setSelectedSubmission(null)}
                    disabled={actionLoading}
                    className="flex-1 px-5 py-3 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-2xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                  >
                    Bỏ qua
                  </button>
                  <button
                    onClick={() => setIsRejectMode(true)}
                    disabled={actionLoading}
                    className="flex-1 px-5 py-3 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-700 rounded-2xl text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <XCircle className="h-4.5 w-4.5" />
                    <span>Không phê duyệt</span>
                  </button>
                  <button
                    onClick={() => handleApprove(selectedSubmission.userId)}
                    disabled={actionLoading}
                    className="flex-1 px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl text-xs font-bold shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4.5 w-4.5" />
                    )}
                    <span>Phê duyệt hồ sơ</span>
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
