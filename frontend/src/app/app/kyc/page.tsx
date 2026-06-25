"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Shield,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Camera,
  Scan,
  ArrowRight,
  Check,
  Sparkles,
  CreditCard,
} from "lucide-react";
import { verificationApi } from "@/lib/api/verification.api";
import { VerificationStatus } from "@/types/verification.types";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useEkyc } from "./hooks/useEkyc";

type UiStatus = "not_submitted" | "pending" | "processing" | "approved" | "rejected";

function mapStatus(s: VerificationStatus): UiStatus {
  if (s === "VERIFIED") return "approved";
  if (s === "REJECTED") return "rejected";
  if (s === "PROCESSING") return "processing";
  // PENDING = CCCD submitted, selfie chưa hoàn tất → cho phép tiếp tục/restart
  return "not_submitted";
}

export default function KYCPage() {
  const { data: session, status: authStatus } = useSession();
  const fetchedRef = useRef(false);

  const [uiStatus, setUiStatus] = useState<UiStatus>("not_submitted");
  const [maskedId, setMaskedId] = useState<string | null>(null);
  const [verifiedName, setVerifiedName] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [consentChecked, setConsentChecked] = useState(false);

  const fetchStatus = async () => {
    if (!session?.accessToken) { setLoading(false); return; }
    try {
      setLoading(true);
      const res = await verificationApi.getStatus();
      if (res.success && res.data) {
        const { status, maskedId: mid, fullName, rejectionReason: reason } = res.data;
        setUiStatus(mapStatus(status));
        setMaskedId(mid ?? null);
        setVerifiedName(fullName ?? null);
        setRejectionReason(reason ?? null);
      }
    } catch {
      toast.error("Không thể tải trạng thái xác minh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authStatus === "loading") return;
    if (authStatus === "authenticated" && session?.accessToken && !fetchedRef.current) {
      fetchedRef.current = true;
      fetchStatus();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, authStatus]);

  const {
    videoRef,
    isEkycModalOpen,
    ekycStep,
    stream,
    finalStatus,
    loading: ekycLoading,
    handleStartEkyc,
    handleEkycNextStep,
    closeEkycModal,
  } = useEkyc({ onComplete: fetchStatus });

  // ── Status screens ───────────────────────────────────────────────────────

  if (uiStatus === "approved") {
    return (
      <div className="min-h-screen bg-gray-50/30 py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-emerald-100 rounded-3xl p-8 text-center shadow-[0_8px_32px_rgba(0,0,0,0.06)] relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
            <div className="bg-emerald-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100">
              <CheckCircle className="h-10 w-10 text-emerald-600 animate-pulse" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-800 mb-3">
              Tài khoản đã xác thực thành công
            </h2>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Danh tính đã được xác minh qua FPT.AI eKYC</span>
            </div>
            <p className="text-gray-500 text-sm max-w-md mx-auto mb-6 leading-relaxed">
              Tuyệt vời! Tài khoản của bạn đã được xác minh danh tính hoàn tất. Bạn có thể ký hợp đồng và sử dụng đầy đủ tính năng trên RentSpace.
            </p>
            {(maskedId || verifiedName) && (
              <div className="max-w-xs mx-auto bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-left space-y-2">
                {verifiedName && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Họ tên CCCD: <strong>{verifiedName}</strong></span>
                  </div>
                )}
                {maskedId && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CreditCard className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Số CCCD: <strong>{maskedId}</strong></span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  if (uiStatus === "processing") {
    return (
      <div className="min-h-screen bg-gray-50/30 py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-amber-100 rounded-3xl p-8 text-center shadow-[0_8px_32px_rgba(0,0,0,0.06)] relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 to-orange-500" />
            <div className="bg-amber-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-100">
              <Clock className="h-10 w-10 text-amber-600 animate-pulse" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-800 mb-3">
              Hồ sơ đang chờ xét duyệt
            </h2>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold mb-6">
              <span>Duyệt thủ công bởi Ban quản trị</span>
            </div>
            <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
              Hệ thống đã nhận hồ sơ của bạn. Quản trị viên sẽ xét duyệt trong vòng <strong>1–3 ngày làm việc</strong>. Bạn sẽ nhận thông báo ngay khi có kết quả.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (uiStatus === "rejected") {
    return (
      <div className="min-h-screen bg-gray-50/30 py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-rose-100 rounded-3xl p-8 text-center shadow-[0_8px_32px_rgba(0,0,0,0.06)] relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-400 to-red-500" />
            <div className="bg-rose-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-100">
              <XCircle className="h-10 w-10 text-rose-600" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-800 mb-3">
              Xác thực danh tính thất bại
            </h2>
            {rejectionReason && (
              <div className="max-w-sm mx-auto mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-left">
                <p className="text-xs font-bold text-rose-700 mb-1">Lý do từ chối:</p>
                <p className="text-sm text-rose-800">{rejectionReason}</p>
              </div>
            )}
            <p className="text-gray-500 text-sm max-w-md mx-auto mb-8 leading-relaxed">
              Vui lòng chuẩn bị thẻ căn cước ở nơi đủ ánh sáng và thực hiện lại quy trình.
            </p>
            <button
              onClick={() => setUiStatus("not_submitted")}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 transition-all text-sm"
            >
              Thực hiện xác minh lại
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading || authStatus === "loading") {
    return (
      <div className="min-h-screen bg-gray-50/50 py-12 flex flex-col items-center justify-center">
        <RefreshCw className="h-10 w-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 text-sm font-semibold">Đang tải thông tin xác minh...</p>
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    return (
      <div className="min-h-[85vh] bg-gray-50/50 py-12 flex items-center justify-center px-4">
        <div className="max-w-md bg-white border border-gray-100 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-3xl p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-400 to-rose-500" />
          <Shield className="h-14 w-14 text-red-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-extrabold text-gray-800 mb-2">Yêu cầu đăng nhập</h2>
          <p className="text-gray-500 text-sm mb-6">Bạn cần đăng nhập để thực hiện xác thực danh tính.</p>
          <a href="/auth/login" className="block w-full bg-blue-600 text-white py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all text-sm">
            Đăng nhập ngay
          </a>
        </div>
      </div>
    );
  }

  // ── Wizard (not_submitted) ───────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50/30 py-10 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-white border border-gray-150 rounded-2xl shadow-sm">
            <Shield className="h-7 w-7 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Xác thực danh tính (eKYC)</h1>
            <p className="text-xs text-gray-400 font-semibold mt-0.5">Bảo vệ tài khoản — yêu cầu để ký hợp đồng</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Lợi ích */}
          <div className="bg-white border border-gray-150 rounded-3xl shadow-sm p-6">
            <h2 className="text-base font-extrabold text-gray-800 mb-4 flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-blue-500" />
              Tại sao bạn nên xác thực danh tính?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: "✓", label: "Uy tín nhân đôi", desc: "Tài khoản có tích xanh được tin cậy hơn 85% trong mắt khách hàng." },
                { icon: "✓", label: "Ký hợp đồng điện tử", desc: "Bắt buộc để ký hợp đồng thuê nhà trên RentSpace." },
                { icon: "✓", label: "An toàn tuyệt đối", desc: "Ngăn ngừa hành vi lừa đảo giả danh, tạo cộng đồng văn minh." },
              ].map((item) => (
                <div key={item.label} className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                  <Check className="h-5 w-5 text-blue-600 mb-2" />
                  <h3 className="text-xs font-extrabold text-gray-800 mb-1">{item.label}</h3>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* eKYC block */}
          <div className="bg-white border border-gray-150 rounded-3xl p-8 shadow-md text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Scan className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-extrabold text-gray-800 mb-2">
                Xác thực khuôn mặt & CCCD (eKYC)
              </h2>
              <p className="text-gray-400 text-xs mb-8 leading-relaxed">
                Hệ thống đối chiếu sinh trắc học khuôn mặt từ camera với ảnh CCCD bằng công nghệ AI tự động. Nếu không đủ độ tin cậy, hồ sơ sẽ được Ban quản trị xét duyệt thủ công.
              </p>

              <div className="space-y-4 mb-8 text-left border border-gray-100 rounded-2xl p-5 bg-gray-50/50">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Quy trình 3 bước:</h3>
                {[
                  "Chụp mặt trước Căn cước công dân",
                  "Chụp mặt sau Căn cước công dân",
                  "Quét selfie khuôn mặt khớp sinh trắc học",
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </div>
                    <span className="text-xs text-gray-600">{step}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-3 bg-blue-50/20 border border-blue-100/55 rounded-2xl p-4.5 mb-6 text-left">
                <input
                  type="checkbox"
                  id="consent-ekyc"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="consent-ekyc" className="text-xs text-gray-500 leading-relaxed cursor-pointer select-none">
                  Tôi đồng ý cho phép <strong className="text-gray-700">RentSpace</strong> xử lý thông tin sinh trắc học phục vụ mục đích xác minh tài khoản theo Nghị định{" "}
                  <strong className="text-gray-700">13/2023/NĐ-CP</strong>.
                </label>
              </div>

              <button
                onClick={() => handleStartEkyc(consentChecked)}
                disabled={!consentChecked || loading || ekycLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl font-extrabold disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Camera className="h-4.5 w-4.5" />
                <span>Bắt đầu xác minh eKYC</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Camera Modal ── */}
      <AnimatePresence>
        {isEkycModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.08)] relative flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-gray-800 flex items-center gap-2">
                    <Scan className="h-5 w-5 text-blue-600" />
                    Định danh sinh trắc học eKYC
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {ekycStep <= 2
                      ? `Bước ${ekycStep}/3 — Chụp ${ekycStep === 1 ? "mặt trước" : "mặt sau"} CCCD`
                      : ekycStep === 3
                      ? "Bước 3/3 — Xác nhận khuôn mặt"
                      : ekycStep === 4
                      ? "Đang xử lý..."
                      : "Hoàn tất"}
                  </p>
                </div>
                {ekycStep < 4 && (
                  <button
                    onClick={closeEkycModal}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Modal Body */}
              <div className="p-6 flex-1 overflow-y-auto flex flex-col justify-between">

                {/* Step indicators */}
                {ekycStep < 4 && (
                  <div className="flex items-center justify-between max-w-sm mx-auto mb-6 w-full">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="flex flex-col items-center gap-1.5 flex-1">
                        <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center transition-all ${
                          ekycStep > n ? "bg-emerald-500 text-white" : ekycStep === n ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "bg-gray-100 text-gray-400"
                        }`}>
                          {ekycStep > n ? <Check className="h-4.5 w-4.5" /> : n}
                        </div>
                        <span className="text-[10px] font-bold text-gray-600">
                          {n === 1 ? "CCCD Trước" : n === 2 ? "CCCD Sau" : "Khuôn mặt"}
                        </span>
                        {n < 3 && <div className="h-0.5 bg-gray-150 flex-1 w-full mt-[-1.5rem]" />}
                      </div>
                    ))}
                  </div>
                )}

                {/* Camera viewport */}
                <div className="flex-1 flex items-center justify-center min-h-[300px]">

                  {/* Steps 1, 2, 3 — camera */}
                  {ekycStep <= 3 && (
                    <div className="relative w-full max-w-md bg-slate-950 rounded-2xl overflow-hidden aspect-[4/3] border border-gray-800 shadow-md">
                      {stream ? (
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-slate-900">
                          <Camera className="h-10 w-10 text-slate-700 animate-pulse mb-3" />
                          <p className="text-slate-400 text-xs font-bold">WEBCAM SIMULATOR</p>
                          <p className="text-slate-500 text-[10px] mt-1 max-w-xs leading-relaxed">
                            Giả lập camera — môi trường phát triển
                          </p>
                        </div>
                      )}

                      {/* CCCD frame guide */}
                      {ekycStep <= 2 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-[85%] h-[65%] border-2 border-dashed border-blue-500 rounded-xl relative flex flex-col justify-between p-4 shadow-[0_0_0_9999px_rgba(15,23,42,0.6)]">
                            <div className="absolute -top-1.5 -left-1.5 w-5 h-5 border-t-4 border-l-4 border-blue-500" />
                            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 border-t-4 border-r-4 border-blue-500" />
                            <div className="absolute -bottom-1.5 -left-1.5 w-5 h-5 border-b-4 border-l-4 border-blue-500" />
                            <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 border-b-4 border-r-4 border-blue-500" />
                            <p className="text-[11px] text-blue-400 font-bold bg-slate-900/80 px-2 py-0.5 rounded mx-auto shadow-sm backdrop-blur-sm self-start">
                              {ekycStep === 1 ? "MẶT TRƯỚC CCCD" : "MẶT SAU CCCD"}
                            </p>
                            <p className="text-[10px] text-slate-300 text-center bg-slate-900/80 px-2 py-1 rounded max-w-xs mx-auto backdrop-blur-sm">
                              Đặt thẻ khớp khung hình và nhấn nút chụp
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Selfie oval guide */}
                      {ekycStep === 3 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-[50%] h-[70%] border-2 border-dashed border-blue-500 rounded-[50%] relative flex flex-col justify-end pb-4 shadow-[0_0_0_9999px_rgba(15,23,42,0.6)]">
                            <p className="text-[10px] text-blue-400 font-bold bg-slate-900/80 px-2.5 py-1 rounded mx-auto shadow-sm backdrop-blur-sm">
                              GIỮ KHUÔN MẶT TRONG KHUNG
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 4 — Processing */}
                  {ekycStep === 4 && (
                    <div className="text-center py-10 max-w-xs mx-auto">
                      <div className="relative w-24 h-24 mx-auto mb-6">
                        <div className="absolute inset-0 rounded-full border-4 border-blue-50 border-t-blue-600 animate-spin" />
                        <div className="absolute inset-2 bg-blue-50 rounded-full flex items-center justify-center">
                          <Scan className="h-8 w-8 text-blue-600 animate-pulse" />
                        </div>
                      </div>
                      <h4 className="text-base font-extrabold text-gray-800 mb-2">Đang xử lý eKYC...</h4>
                      <p className="text-gray-400 text-xs leading-relaxed">
                        Hệ thống đang trích xuất và đối sánh dữ liệu. Vui lòng không đóng cửa sổ này.
                      </p>
                    </div>
                  )}

                  {/* Step 5 — Result */}
                  {ekycStep === 5 && (
                    <div className="text-center py-6 max-w-md mx-auto">
                      {finalStatus === "VERIFIED" ? (
                        <>
                          <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="h-9 w-9 text-emerald-600" />
                          </div>
                          <h4 className="text-lg font-extrabold text-gray-800 mb-2">Xác thực tự động thành công</h4>
                          <p className="text-gray-500 text-xs leading-relaxed mb-6">
                            Ảnh sinh trắc học hoàn toàn trùng khớp thẻ căn cước. Tài khoản đã được nâng cấp lên trạng thái đã xác thực.
                          </p>
                        </>
                      ) : finalStatus === "REJECTED" ? (
                        <>
                          <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle className="h-9 w-9 text-rose-600" />
                          </div>
                          <h4 className="text-lg font-extrabold text-gray-800 mb-2">Xác thực thất bại</h4>
                          <p className="text-gray-500 text-xs leading-relaxed mb-6">
                            Khuôn mặt không khớp CCCD. Chụp lại ở góc thẳng, đủ ánh sáng và không đeo kính.
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="w-16 h-16 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="h-9 w-9 text-amber-600 animate-pulse" />
                          </div>
                          <h4 className="text-lg font-extrabold text-gray-800 mb-2">Đang chờ xét duyệt thủ công</h4>
                          <p className="text-gray-500 text-xs leading-relaxed mb-6">
                            Hồ sơ đã được gửi. Ban quản trị sẽ xét duyệt trong 1–3 ngày làm việc. Bạn sẽ nhận thông báo khi có kết quả.
                          </p>
                        </>
                      )}
                      <button
                        onClick={closeEkycModal}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 text-xs transition-all"
                      >
                        Đóng cửa sổ
                      </button>
                    </div>
                  )}
                </div>

                {/* Camera controls */}
                {ekycStep <= 3 && (
                  <div className="mt-8 flex gap-3">
                    <button
                      onClick={closeEkycModal}
                      className="flex-1 py-3 text-xs font-bold border border-gray-150 rounded-2xl hover:bg-gray-50 transition-all text-gray-600"
                    >
                      Hủy phiên
                    </button>
                    <button
                      onClick={handleEkycNextStep}
                      disabled={ekycLoading}
                      className="flex-1 py-3 text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-md shadow-blue-500/10 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      {ekycLoading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                      <span>
                        {ekycStep === 1
                          ? "Chụp mặt trước CCCD"
                          : ekycStep === 2
                          ? "Chụp mặt sau CCCD"
                          : "Xác nhận khuôn mặt"}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
