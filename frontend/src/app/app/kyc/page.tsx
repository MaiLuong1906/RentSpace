"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { 
  Shield, 
  Upload, 
  CheckCircle, 
  Clock, 
  XCircle, 
  FileImage, 
  RefreshCw, 
  Camera, 
  Scan, 
  ArrowRight, 
  Check, 
  Sparkles 
} from "lucide-react";
import { kycApi } from "@/lib/api/kyc.api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useEkyc } from "./hooks/useEkyc";


export default function KYCPage() {
  const { data: session, status: authStatus } = useSession();
  const fetchedRef = useRef(false);
  
  // Trạng thái KYC của người dùng
  const [kycStatus, setKycStatus] = useState<"not_submitted" | "pending" | "approved" | "rejected">("not_submitted");
  const [cccdImageUrl, setCccdImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [kycReviewMode, setKycReviewMode] = useState<"AUTO" | "MANUAL" | null>(null);
  const [ekycConfidence, setEkycConfidence] = useState<number | null>(null);

  // Chọn phương thức: ekyc hoặc manual
  const [kycMethod, setKycMethod] = useState<"ekyc" | "manual">("ekyc");
  
  // Trạng thái Form nộp hồ sơ truyền thống
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  // Tải trạng thái eKYC và các phương thức xử lý từ custom hook useEkyc
  const {
    videoRef,
    isEkycModalOpen,
    ekycStep,
    stream,
    capturedFront,
    capturedBack,
    ekycSessionId,
    simulationMode,
    setSimulationMode,
    loading: ekycLoading,
    handleStartEkyc,
    handleEkycNextStep,
    closeEkycModal
  } = useEkyc({
    onComplete: async () => {
      await fetchKycStatus();
    }
  });

  const isLocalhost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  // Tải trạng thái KYC hiện tại của người dùng từ Backend
  const fetchKycStatus = async () => {
    if (!session?.accessToken) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await kycApi.getKycStatus();
      if (res.success && res.data) {
        const { status, cccdImageUrl: imgUrl, reviewMode, confidence } = res.data;
        setCccdImageUrl(imgUrl);
        setKycReviewMode(reviewMode || null);
        setEkycConfidence(confidence ? parseFloat(confidence.toString()) : null);

        // Ánh xạ trạng thái từ Backend sang Frontend UI
        if (status === "VERIFIED") {
          setKycStatus("approved");
        } else if (status === "REJECTED") {
          setKycStatus("rejected");
        } else if (status === "PENDING" && imgUrl) {
          setKycStatus("pending");
        } else {
          setKycStatus("not_submitted");
        }
      }
    } catch (error) {
      console.error("Lỗi khi tải trạng thái KYC:", error);
      toast.error("Không thể tải trạng thái KYC của bạn.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authStatus === "loading") return;

    if (authStatus === "authenticated") {
      if (session?.accessToken && !fetchedRef.current) {
        fetchedRef.current = true;
        fetchKycStatus();
      } else if (!session?.accessToken) {
        const timer = setTimeout(() => {
          setLoading(false);
        }, 1500);
        return () => clearTimeout(timer);
      }
    } else if (authStatus === "unauthenticated") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, authStatus]);

  // Nộp hồ sơ thủ công (Truyền thống)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Kích thước ảnh tối đa là 5MB!");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Vui lòng chọn tệp tin định dạng hình ảnh!");
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Vui lòng tải lên ảnh CCCD của bạn.");
      return;
    }
    if (!consentChecked) {
      toast.error("Bạn phải đồng ý với chính sách bảo mật.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await kycApi.submitKyc(selectedFile);
      if (res.success) {
        toast.success("Nộp hồ sơ KYC thành công! Vui lòng chờ quản trị viên phê duyệt.");
        await fetchKycStatus();
      } else {
        toast.error(res.message || "Đã xảy ra lỗi khi nộp hồ sơ.");
      }
    } catch (error) {
      console.error("Lỗi submit KYC:", error);
      toast.error("Lỗi kết nối khi nộp hồ sơ KYC.");
    } finally {
      setIsSubmitting(false);
    }
  };
   // Render trạng thái KYC của người dùng
  const renderStatus = () => {
    switch (kycStatus) {
      case "approved":
        return (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-emerald-100 rounded-3xl p-8 text-center shadow-xl shadow-emerald-500/5 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
            <div className="bg-emerald-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100">
              <CheckCircle className="h-10 w-10 text-emerald-600 animate-pulse" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-800 mb-2">
              Tài khoản đã xác thực thành công
            </h2>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Chế độ duyệt: {kycReviewMode === "AUTO" ? "Tự động (eKYC)" : "Thủ công (Admin)"}</span>
            </div>
            <p className="text-gray-500 text-sm max-w-md mx-auto mb-8 leading-relaxed">
              Tuyệt vời! Tài khoản của bạn đã được xác minh danh tính hoàn tất. Bây giờ bạn đã mở khóa đầy đủ tất cả đặc quyền đăng bài và nhắn tin trên hệ thống.
            </p>
            {cccdImageUrl && (
              <div className="max-w-xs mx-auto border border-gray-150 rounded-2xl overflow-hidden shadow-inner bg-gray-50">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider py-2 bg-gray-100/50">Ảnh CCCD xác minh</p>
                <Image src={cccdImageUrl} alt="CCCD" className="w-full h-44 object-cover" width={320} height={176} unoptimized />
              </div>
            )}
          </motion.div>
        );

      case "pending":
        return (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-amber-100 rounded-3xl p-8 text-center shadow-xl shadow-amber-500/5 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 to-orange-500" />
            <div className="bg-amber-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-100 animate-spin-slow">
              <Clock className="h-10 w-10 text-amber-600" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-800 mb-2">
              Hồ sơ đang chờ phê duyệt
            </h2>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold mb-6">
              <span>Phương thức: {kycReviewMode === "MANUAL" ? "Duyệt thủ công" : "eKYC Chờ Đối Soát"}</span>
            </div>
            <p className="text-gray-500 text-sm max-w-md mx-auto mb-8 leading-relaxed">
              Hồ sơ xác minh thông tin cá nhân của bạn đang được Ban quản trị xem duyệt đối sánh thủ công. Quy trình này thường diễn ra nhanh chóng trong vòng 1-2 ngày làm việc.
            </p>
            {cccdImageUrl && (
              <div className="max-w-xs mx-auto border border-gray-150 rounded-2xl overflow-hidden shadow-sm bg-gray-50">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider py-2 bg-gray-100/50">Tài liệu đã tải lên</p>
                <Image src={cccdImageUrl} alt="CCCD Pending" className="w-full h-44 object-cover opacity-80" width={320} height={176} unoptimized />
              </div>
            )}
          </motion.div>
        );

      case "rejected":
        return (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-rose-100 rounded-3xl p-8 text-center shadow-xl shadow-rose-500/5 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-400 to-red-500" />
            <div className="bg-rose-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-100">
              <XCircle className="h-10 w-10 text-rose-600" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-800 mb-2">
              Xác thực danh tính thất bại
            </h2>
            <p className="text-rose-700 text-xs font-bold mb-6">
              Ảnh quét sinh trắc học / CCCD không khớp hoặc bị mờ.
            </p>
            <p className="text-gray-500 text-sm max-w-md mx-auto mb-8 leading-relaxed">
              Chúng tôi không thể tự động phê duyệt hoặc xác minh hồ sơ do độ chính xác thấp. Vui lòng chuẩn bị thẻ căn cước ở nơi đủ ánh sáng và chụp lại rõ nét hơn.
            </p>
            <button
              onClick={() => {
                setKycStatus("not_submitted");
                setSelectedFile(null);
                setFilePreview(null);
              }}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all text-sm"
            >
              Thực hiện định danh lại
            </button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  // Trạng thái Loading ban đầu
  if (loading || authStatus === "loading") {
    return (
      <div className="min-h-screen bg-gray-50/50 py-12 flex flex-col items-center justify-center">
        <RefreshCw className="h-10 w-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 text-sm font-semibold">Đang tải thông tin KYC của bạn...</p>
      </div>
    );
  }

  // Bắt buộc đăng nhập
  if (authStatus === "unauthenticated") {
    return (
      <div className="min-h-[85vh] bg-gray-50/50 py-12 flex items-center justify-center px-4">
        <div className="max-w-md bg-white border border-gray-100 shadow-xl rounded-3xl p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-400 to-rose-500" />
          <Shield className="h-14 w-14 text-red-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-extrabold text-gray-800 mb-2">Yêu cầu đăng nhập</h2>
          <p className="text-gray-500 text-sm mb-6">
            Bạn cần đăng nhập tài khoản để thực hiện quy trình xác thực danh tính (eKYC/KYC).
          </p>
          <a
            href="/auth/login"
            className="block w-full bg-blue-600 text-white py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-500/10"
          >
            Đăng nhập ngay
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        
        {/* Tiêu đề trang */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-white border border-gray-150 rounded-2xl shadow-sm">
            <Shield className="h-7 w-7 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Xác thực danh tính (KYC)
            </h1>
            <p className="text-xs text-gray-400 font-semibold mt-0.5">Bảo vệ tài khoản, xác minh quyền đăng tin & giao dịch</p>
          </div>
        </div>

        {/* Khối hiển thị trạng thái KYC hiện tại của user */}
        {kycStatus !== "not_submitted" ? (
          renderStatus()
        ) : (
          <div className="space-y-6">
            
            {/* Lợi ích của KYC */}
            <div className="bg-white border border-gray-150 rounded-3xl shadow-sm p-6">
              <h2 className="text-base font-extrabold text-gray-800 mb-4 flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-blue-500" />
                Tại sao bạn nên xác thực danh tính?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                  <Check className="h-5 w-5 text-blue-600 mb-2" />
                  <h3 className="text-xs font-extrabold text-gray-800 mb-1">Uy tín nhân đôi</h3>
                  <p className="text-[11px] text-gray-500 leading-relaxed">Tài khoản có tích xanh được tin cậy hơn 85% trong mắt khách hàng.</p>
                </div>
                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                  <Check className="h-5 w-5 text-emerald-600 mb-2" />
                  <h3 className="text-xs font-extrabold text-gray-800 mb-1">Tin đăng chất lượng</h3>
                  <p className="text-[11px] text-gray-500 leading-relaxed">Tin đăng của tài khoản đã KYC được ưu tiên hiển thị ở vị trí hàng đầu.</p>
                </div>
                <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl">
                  <Check className="h-5 w-5 text-purple-600 mb-2" />
                  <h3 className="text-xs font-extrabold text-gray-800 mb-1">An toàn tuyệt đối</h3>
                  <p className="text-[11px] text-gray-500 leading-relaxed">Ngăn ngừa hành vi lừa đảo giả danh, tạo cộng đồng thuê trọ văn minh.</p>
                </div>
              </div>
            </div>

            {/* TAB Lựa chọn phương thức xác thực */}
            <div className="bg-white border border-gray-150 rounded-3xl p-1 shadow-sm flex">
              <button
                onClick={() => setKycMethod("ekyc")}
                className={`flex-1 py-3 text-sm font-bold rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 ${
                  kycMethod === "ekyc" 
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/10" 
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                <Scan className="h-4.5 w-4.5" />
                <span>eKYC Tự Động (Nhanh 3 phút)</span>
              </button>
              <button
                onClick={() => setKycMethod("manual")}
                className={`flex-1 py-3 text-sm font-bold rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 ${
                  kycMethod === "manual" 
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/10" 
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                <Upload className="h-4.5 w-4.5" />
                <span>Nộp CCCD truyền thống</span>
              </button>
            </div>

            {/* Khối hiển thị form tương ứng với Tab */}
            {kycMethod === "ekyc" ? (
              <div className="bg-white border border-gray-150 rounded-3xl p-8 shadow-md text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Scan className="h-8 w-8 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-extrabold text-gray-800 mb-2">
                    Xác thực khuôn mặt & CCCD (eKYC)
                  </h2>
                  <p className="text-gray-400 text-xs mb-8 leading-relaxed">
                    Hệ thống sẽ đối chiếu sinh trắc học khuôn mặt từ camera trực tiếp với ảnh chụp căn cước của bạn bằng công nghệ AI tự động.
                  </p>

                  <div className="space-y-4 mb-8 text-left border border-gray-100 rounded-2xl p-5 bg-gray-50/50">
                    <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Quy trình quét 3 bước:</h3>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center">1</div>
                      <span className="text-xs text-gray-600">Ảnh chụp mặt trước thẻ Căn cước công dân</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center">2</div>
                      <span className="text-xs text-gray-600">Ảnh chụp mặt sau thẻ Căn cước công dân</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center">3</div>
                      <span className="text-xs text-gray-600">Quét ảnh selfie khuôn mặt khớp sinh trắc học</span>
                    </div>
                  </div>

                  {/* Đồng ý cam kết Nghị định 13 */}
                  <div className="flex items-start gap-3 bg-blue-50/20 border border-blue-100/55 rounded-2xl p-4.5 mb-6 text-left">
                    <input
                      type="checkbox"
                      id="consent-ekyc"
                      checked={consentChecked}
                      onChange={(e) => setConsentChecked(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="consent-ekyc" className="text-xs text-gray-500 leading-relaxed cursor-pointer select-none">
                      Tôi xác nhận thông tin trên và cho phép **RentSpace** xử lý thông tin cá nhân nhạy cảm này hoàn toàn tự động phục vụ mục đích xác minh tài khoản theo Nghị định bảo vệ dữ liệu cá nhân <strong className="text-gray-700">13/2023/NĐ-CP</strong>.
                    </label>
                  </div>

                  <button
                    onClick={() => handleStartEkyc(consentChecked)}
                    disabled={!consentChecked || loading || ekycLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-2xl font-extrabold shadow-lg shadow-blue-500/20 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all text-sm flex items-center justify-center gap-2"
                  >
                    <Camera className="h-4.5 w-4.5" />
                    <span>Bắt đầu quét eKYC ngay</span>
                  </button>
                </div>
              </div>
            ) : (
              // Tab Nộp ảnh truyền thống
              <div className="bg-white border border-gray-150 rounded-3xl p-8 shadow-md">
                <h2 className="text-xl font-extrabold text-gray-800 mb-6">Tải tài liệu căn cước thủ công</h2>
                <form onSubmit={handleManualSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                      Ảnh chụp rõ nét Căn cước công dân (Mặt trước)
                    </label>
                    <div className="max-w-md mx-auto">
                      <label className="block cursor-pointer">
                        <div className="border-3 border-dashed border-gray-200 hover:border-blue-500 rounded-2xl p-6 text-center transition-all bg-gray-50/50 hover:bg-white relative min-h-[220px] flex flex-col items-center justify-center">
                          {filePreview ? (
                            <div className="w-full flex flex-col items-center">
                              <Image
                                src={filePreview}
                                alt="Xem trước ảnh CCCD"
                                className="w-full max-h-48 object-contain rounded-xl border border-gray-100 shadow-sm"
                                width={400}
                                height={192}
                                unoptimized
                              />
                              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-100 text-blue-700 rounded-full text-xs font-bold">
                                <FileImage className="h-3.5 w-3.5" />
                                <span>{selectedFile?.name}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="p-4 bg-white border border-gray-100 rounded-full shadow-md inline-block">
                                <Upload className="h-8 w-8 text-blue-500" />
                              </div>
                              <p className="text-sm font-bold text-gray-700">Tải lên tệp ảnh CCCD</p>
                              <p className="text-xs text-gray-400">Chấp nhận JPG, PNG, WEBP tối đa 5MB</p>
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                          required
                        />
                      </label>
                    </div>
                  </div>

                  {/* Cam kết tuân thủ nghị định 13 */}
                  <div className="flex items-start gap-3 bg-gray-50 border border-gray-150 rounded-2xl p-4.5">
                    <input
                      type="checkbox"
                      id="consent-manual"
                      checked={consentChecked}
                      onChange={(e) => setConsentChecked(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      required
                    />
                    <label htmlFor="consent-manual" className="text-xs text-gray-500 leading-relaxed cursor-pointer select-none">
                      Tôi xác nhận thông tin trên là chính xác và đồng ý cho phép **RentSpace** xử lý thông tin cá nhân nhạy cảm này phục vụ mục đích xác minh tài khoản theo Nghị định bảo vệ dữ liệu cá nhân <strong className="text-gray-700">13/2023/NĐ-CP</strong>.
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={!selectedFile || !consentChecked || isSubmitting}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-2xl font-extrabold shadow-lg shadow-blue-500/20 hover:shadow-xl transition-all text-sm flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Đang tải tệp & xử lý dữ liệu...</span>
                      </>
                    ) : (
                      <>
                        <Shield className="h-4.5 w-4.5" />
                        <span>Nộp hồ sơ duyệt thủ công</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* CAMERA SCANNER MODAL & GUIDED FLOW                            */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isEkycModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              
              {/* Dev Simulation Toolbar (localhost only) */}
              {isLocalhost && (
                <div className="bg-slate-950 text-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 text-xs">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-blue-400">
                    <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                    <span>DEV SIMULATION TOOLBAR:</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Chọn kịch bản test eKYC:</span>
                    <button
                      onClick={() => setSimulationMode("SUCCESS")}
                      className={`px-2.5 py-1 rounded font-bold ${
                        simulationMode === "SUCCESS" 
                          ? "bg-emerald-600 text-white" 
                          : "bg-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      SUCCESS (Auto)
                    </button>
                    <button
                      onClick={() => setSimulationMode("NEED_REVIEW")}
                      className={`px-2.5 py-1 rounded font-bold ${
                        simulationMode === "NEED_REVIEW" 
                          ? "bg-amber-600 text-white" 
                          : "bg-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      NEED_REVIEW (Manual)
                    </button>
                    <button
                      onClick={() => setSimulationMode("FAIL")}
                      className={`px-2.5 py-1 rounded font-bold ${
                        simulationMode === "FAIL" 
                          ? "bg-rose-600 text-white" 
                          : "bg-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      FAIL (Reject)
                    </button>
                  </div>
                </div>
              )}

              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-gray-800 flex items-center gap-2">
                    <Scan className="h-5 w-5 text-blue-600" />
                    Định danh sinh trắc học eKYC
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">Phiên session: {ekycSessionId}</p>
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

              {/* Modal Content / Scanner Screen */}
              <div className="p-6 flex-1 overflow-y-auto flex flex-col justify-between">
                
                {/* 3 Step indicators */}
                {ekycStep < 4 && (
                  <div className="flex items-center justify-between max-w-sm mx-auto mb-6 w-full">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center transition-all ${
                        ekycStep >= 1 ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "bg-gray-100 text-gray-400"
                      }`}>
                        {ekycStep > 1 ? <Check className="h-4.5 w-4.5" /> : "1"}
                      </div>
                      <span className="text-[10px] font-bold text-gray-600">CCCD Trước</span>
                    </div>
                    <div className="h-0.5 bg-gray-150 flex-1 mx-3" />
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center transition-all ${
                        ekycStep >= 2 ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "bg-gray-100 text-gray-400"
                      }`}>
                        {ekycStep > 2 ? <Check className="h-4.5 w-4.5" /> : "2"}
                      </div>
                      <span className="text-[10px] font-bold text-gray-600">CCCD Sau</span>
                    </div>
                    <div className="h-0.5 bg-gray-150 flex-1 mx-3" />
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center transition-all ${
                        ekycStep >= 3 ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "bg-gray-100 text-gray-400"
                      }`}>
                        3
                      </div>
                      <span className="text-[10px] font-bold text-gray-600">Khuôn mặt</span>
                    </div>
                  </div>
                )}

                {/* Viewport container */}
                <div className="flex-1 flex items-center justify-center min-h-[300px]">
                  
                  {/* STEP 1, 2, 3: CAMERA SCANNER SCREEN */}
                  {ekycStep <= 3 && (
                    <div className="relative w-full max-w-md bg-slate-950 rounded-2xl overflow-hidden aspect-[4/3] border border-gray-800 shadow-md">
                      
                      {/* Video element for webcam */}
                      {stream ? (
                        <video 
                          ref={videoRef}
                          autoPlay 
                          playsInline 
                          muted 
                          className="w-full h-full object-cover scale-x-[-1]"
                        />
                      ) : (
                        // Mock camera canvas overlay when stream is missing (simulation)
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-slate-900">
                          <Camera className="h-10 w-10 text-slate-700 animate-pulse mb-3" />
                          <p className="text-slate-400 text-xs font-bold">WEBCAM SIMULATOR</p>
                          <p className="text-slate-500 text-[10px] mt-1 max-w-xs leading-relaxed">
                            (Giả lập camera hoạt động trên trình duyệt thử nghiệm)
                          </p>
                        </div>
                      )}

                      {/* Card Scanner Border Guides (Steps 1, 2) */}
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

                      {/* Oval Face Guide (Step 3: Selfie) */}
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

                  {/* STEP 4: PROCESSING SCREEN */}
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
                        Hệ thống đang trích xuất dữ liệu thẻ và đối sánh khuôn mặt. Vui lòng không đóng cửa sổ này.
                      </p>
                    </div>
                  )}

                  {/* STEP 5: COMPLETION & RESULT FEEDBACK */}
                  {ekycStep === 5 && (
                    <div className="text-center py-6 max-w-md mx-auto">
                      {kycStatus === "approved" ? (
                        <div>
                          <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="h-9 w-9 text-emerald-600" />
                          </div>
                          <h4 className="text-lg font-extrabold text-gray-800 mb-2">Xác thực tự động thành công</h4>
                          <p className="text-gray-500 text-xs leading-relaxed mb-6">
                            Tuyệt vời! Ảnh sinh trắc học hoàn toàn trùng khớp thẻ căn cước. Tài khoản của bạn đã được nâng cấp lên trạng thái đã xác thực thành công.
                          </p>
                        </div>
                      ) : kycStatus === "pending" ? (
                        <div>
                          <div className="w-16 h-16 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="h-9 w-9 text-amber-600 animate-pulse" />
                          </div>
                          <h4 className="text-lg font-extrabold text-gray-800 mb-2">Đang chuyển xét duyệt thủ công</h4>
                          <p className="text-gray-500 text-xs leading-relaxed mb-6">
                            Độ khớp sinh trắc học đạt mức trung bình ({ekycConfidence || 71.20}%). Để bảo mật thông tin, hồ sơ của bạn đã được gửi cho Quản trị viên duyệt thủ công. Bạn sẽ sớm nhận được email kết quả.
                          </p>
                        </div>
                      ) : (
                        <div>
                          <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle className="h-9 w-9 text-rose-600" />
                          </div>
                          <h4 className="text-lg font-extrabold text-gray-800 mb-2">Không đạt tiêu chuẩn eKYC</h4>
                          <p className="text-gray-500 text-xs leading-relaxed mb-6">
                            Chỉ số nhận dạng khớp mặt không đạt yêu cầu bảo mật tối thiểu. Vui lòng đảm bảo bạn chụp ở góc thẳng, đủ ánh sáng và không đeo kính đen/khẩu trang.
                          </p>
                        </div>
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

                {/* Bottom button controls */}
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
                      className="flex-1 py-3 text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-md shadow-blue-500/10 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Camera className="h-4 w-4" />
                      <span>
                        {ekycStep === 1 ? "Chụp mặt trước CCCD" : ekycStep === 2 ? "Chụp mặt sau CCCD" : "Xác nhận khuôn mặt"}
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
