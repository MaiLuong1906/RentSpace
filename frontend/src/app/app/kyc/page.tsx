"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Shield, Upload, CheckCircle, Clock, XCircle, FileImage, RefreshCw } from "lucide-react";
import { kycApi } from "@/lib/api/kyc.api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function KYCPage() {
  const { data: session, status: authStatus } = useSession();
  const fetchedRef = useRef(false);
  
  // Trạng thái KYC của người dùng
  const [kycStatus, setKycStatus] = useState<"not_submitted" | "pending" | "approved" | "rejected">("not_submitted");
  const [cccdImageUrl, setCccdImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Trạng thái Form nộp hồ sơ
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

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
        const { status, cccdImageUrl: imgUrl } = res.data;
        setCccdImageUrl(imgUrl);

        // Ánh xạ trạng thái từ Backend sang Frontend UI
        if (status === "VERIFIED") {
          setKycStatus("approved");
        } else if (status === "REJECTED") {
          setKycStatus("rejected");
        } else if (status === "PENDING" && imgUrl) {
          // Trạng thái PENDING ở backend và đã có ảnh CCCD -> đang chờ admin duyệt
          setKycStatus("pending");
        } else {
          // PENDING và chưa có ảnh -> Chưa nộp hồ sơ
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
        // Có session nhưng chưa có accessToken thì đợi tiếp hoặc tắt loading để tránh treo
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

  // Xử lý chọn tệp tin ảnh
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

  // Xử lý gửi Form nộp KYC lên Backend
  const handleSubmit = async (e: React.FormEvent) => {
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
      toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || "Lỗi kết nối khi nộp hồ sơ KYC.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trình duyệt trạng thái KYC
  const renderStatus = () => {
    switch (kycStatus) {
      case "approved":
        return (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 text-center shadow-lg shadow-emerald-500/5"
          >
            <CheckCircle className="h-16 w-16 text-emerald-600 mx-auto mb-4 animate-bounce" />
            <h2 className="text-2xl font-extrabold text-emerald-950 mb-2">
              Tài khoản đã được xác thực
            </h2>
            <p className="text-emerald-700 text-sm max-w-md mx-auto mb-6">
              Chúc mừng! Danh tính của bạn đã được xác minh thành công. Bây giờ bạn đã mở khóa đầy đủ quyền đăng tin và sử dụng dịch vụ.
            </p>
            {cccdImageUrl && (
              <div className="max-w-xs mx-auto border border-emerald-100 rounded-2xl overflow-hidden shadow-inner">
                <p className="text-xs text-emerald-600 font-bold mb-2 bg-emerald-100/50 py-1.5">Ảnh chụp CCCD đã lưu</p>
                <img src={cccdImageUrl} alt="CCCD" className="w-full h-44 object-cover" />
              </div>
            )}
          </motion.div>
        );

      case "pending":
        return (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50/70 border border-amber-200 rounded-3xl p-8 text-center shadow-lg shadow-amber-500/5"
          >
            <Clock className="h-16 w-16 text-amber-600 mx-auto mb-4 animate-spin-slow" />
            <h2 className="text-2xl font-extrabold text-amber-950 mb-2">
              Hồ sơ đang chờ phê duyệt
            </h2>
            <p className="text-amber-700 text-sm max-w-md mx-auto mb-6">
              Hồ sơ KYC của bạn đang được quản trị viên xem xét kỹ lưỡng. Quá trình kiểm tra thông thường mất từ 1-2 ngày làm việc.
            </p>
            {cccdImageUrl && (
              <div className="max-w-xs mx-auto border border-amber-200/50 rounded-2xl overflow-hidden shadow-sm">
                <p className="text-xs text-amber-700 font-bold mb-2 bg-amber-100/40 py-1.5">Ảnh chụp đã nộp</p>
                <img src={cccdImageUrl} alt="CCCD Pending" className="w-full h-44 object-cover opacity-80" />
              </div>
            )}
          </motion.div>
        );

      case "rejected":
        return (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center shadow-lg shadow-rose-500/5 mb-6"
          >
            <XCircle className="h-16 w-16 text-rose-600 mx-auto mb-4" />
            <h2 className="text-2xl font-extrabold text-rose-950 mb-2">
              Hồ sơ bị từ chối xác thực
            </h2>
            <p className="text-rose-700 text-sm max-w-md mx-auto mb-6">
              Rất tiếc! Hồ sơ KYC của bạn không đủ tiêu chuẩn (hình ảnh mờ, bị cắt góc hoặc không khớp thông tin). Vui lòng thử lại với một bức ảnh rõ nét hơn.
            </p>
            <button
              onClick={() => {
                setKycStatus("not_submitted");
                setSelectedFile(null);
                setFilePreview(null);
              }}
              className="px-8 py-3 bg-rose-600 text-white rounded-2xl font-bold shadow-lg shadow-rose-500/20 hover:bg-rose-700 transition-all hover:scale-105 active:scale-95 text-sm"
            >
              Nộp lại hồ sơ mới
            </button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  // Trạng thái tải dữ liệu
  if (loading || authStatus === "loading") {
    return (
      <div className="min-h-screen bg-gray-50/50 py-12 flex flex-col items-center justify-center">
        <RefreshCw className="h-10 w-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 text-sm font-semibold">Đang tải trạng thái KYC của bạn...</p>
      </div>
    );
  }

  // Yêu cầu đăng nhập nếu chưa authenticate
  if (authStatus === "unauthenticated") {
    return (
      <div className="min-h-[85vh] bg-gray-50/50 py-12 flex items-center justify-center px-4">
        <div className="max-w-md bg-white border border-gray-100 shadow-xl rounded-3xl p-8 text-center">
          <Shield className="h-14 w-14 text-red-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-extrabold text-gray-800 mb-2">Yêu cầu đăng nhập</h2>
          <p className="text-gray-500 text-sm mb-6">
            Bạn cần đăng nhập tài khoản để thực hiện quy trình xác thực danh tính (KYC).
          </p>
          <a
            href="/auth/login"
            className="block w-full bg-blue-600 text-white py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all"
          >
            Đăng nhập ngay
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-2xl shadow-inner">
            <Shield className="h-7 w-7 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Xác thực danh tính (KYC)
            </h1>
            <p className="text-xs text-gray-400 font-medium">Bảo mật thông tin & tăng uy tín trên hệ thống</p>
          </div>
        </div>

        {/* Khối hiển thị trạng thái KYC của user */}
        {kycStatus !== "not_submitted" ? (
          renderStatus()
        ) : (
          <div className="space-y-6">
            {/* Hướng dẫn vì sao cần KYC */}
            <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Tại sao cần xác thực KYC?</h2>
              <ul className="space-y-3.5 text-sm text-gray-600">
                <li className="flex items-start gap-3">
                  <div className="p-1 bg-emerald-50 rounded-lg border border-emerald-100">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <strong className="text-gray-800 block">Tăng độ tin cậy</strong>
                    <span>Chủ nhà đã xác thực sẽ thu hút nhiều người thuê hơn 80% so với tài khoản thông thường.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="p-1 bg-emerald-50 rounded-lg border border-emerald-100">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <strong className="text-gray-800 block">Tránh lừa đảo phòng trọ</strong>
                    <span>Bảo vệ quyền lợi cộng đồng, bài trừ các tin đăng ảo, cọc tiền gian lận.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="p-1 bg-emerald-50 rounded-lg border border-emerald-100">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <strong className="text-gray-800 block">Mở khóa đầy đủ quyền hạn</strong>
                    <span>Được phép tạo tin đăng mới không giới hạn, tham gia nhắn tin thời gian thực.</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Form nộp hồ sơ KYC */}
            <div className="bg-white border border-gray-100 rounded-3xl shadow-md p-8">
              <h2 className="text-xl font-extrabold text-gray-800 mb-6">Tải lên hồ sơ xác thực</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Ảnh chụp rõ nét Căn cước công dân (Mặt trước)
                  </label>

                  <div className="max-w-md mx-auto">
                    <label className="block cursor-pointer">
                      <div className="border-3 border-dashed border-gray-200 hover:border-blue-500 rounded-2xl p-6 text-center transition-all bg-gray-50/50 hover:bg-white relative min-h-[220px] flex flex-col items-center justify-center">
                        {filePreview ? (
                          <div className="w-full flex flex-col items-center">
                            <img
                              src={filePreview}
                              alt="Xem trước ảnh CCCD"
                              className="w-full max-h-48 object-contain rounded-xl border border-gray-100 shadow-sm"
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

                  <div className="mt-6 p-4.5 bg-blue-50/70 border border-blue-100 rounded-2xl text-xs text-blue-800 leading-relaxed">
                    💡 <strong>Lưu ý quan trọng khi chụp ảnh:</strong> Ảnh chụp phải đầy đủ 4 góc, không bị lóa sáng bởi đèn flash, thông tin dạng văn bản và ảnh chân dung trên thẻ phải hiển thị cực kỳ rõ nét để hỗ trợ hệ thống đối chiếu nhanh nhất.
                  </div>
                </div>

                {/* Cam kết tuân thủ nghị định 13 */}
                <div className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-2xl p-4.5">
                  <input
                    type="checkbox"
                    id="consent"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    required
                  />
                  <label htmlFor="consent" className="text-xs text-gray-600 leading-relaxed select-none cursor-pointer">
                    Tôi xác nhận thông tin trên là chính xác và đồng ý cho phép **RentSpace** xử lý thông tin cá nhân nhạy cảm này hoàn toàn phục vụ mục đích xác minh tài khoản theo{" "}
                    <a href="#" className="text-blue-600 font-bold hover:underline">Chính sách bảo mật</a> và Nghị định bảo vệ dữ liệu cá nhân <strong className="text-gray-700">13/2023/NĐ-CP</strong>.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={!selectedFile || !consentChecked || isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-2xl font-extrabold shadow-lg shadow-blue-500/20 hover:shadow-xl active:scale-[0.99] disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all text-sm flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Đang tải tệp & xử lý dữ liệu...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="h-4.5 w-4.5" />
                      <span>Nộp hồ sơ xác thực</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
