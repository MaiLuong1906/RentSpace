import { useState, useRef } from "react";
import { verificationApi } from "@/lib/api/verification.api";
import { VerificationStatus } from "@/types/verification.types";
import { toast } from "sonner";

interface UseEkycProps {
  onComplete?: () => Promise<void> | void;
}

function dataUrlToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}

export function useEkyc({ onComplete }: UseEkycProps = {}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isEkycModalOpen, setIsEkycModalOpen] = useState(false);
  // 1: CCCD Trước | 2: CCCD Sau | 3: Selfie | 4: Processing | 5: Done
  const [ekycStep, setEkycStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedFront, setCapturedFront] = useState<string | null>(null);
  const [capturedBack, setCapturedBack] = useState<string | null>(null);
  const [faceToken, setFaceToken] = useState<string | null>(null);
  const [finalStatus, setFinalStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const startCamera = async () => {
    try {
      stopCamera();
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn("Không thể mở webcam thực. Sử dụng webcam giả lập.", err);
      toast.info("Không tìm thấy camera. Hệ thống chuyển sang chế độ camera giả lập.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  };

  const capturePhoto = (): string => {
    if (stream && videoRef.current) {
      try {
        const video = videoRef.current;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          return canvas.toDataURL("image/jpeg");
        }
      } catch (err) {
        console.error("Lỗi chụp ảnh từ camera:", err);
      }
    }
    // Fallback mock image cho môi trường không có camera
    return "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
  };

  const handleStartEkyc = async (consentChecked: boolean) => {
    if (!consentChecked) {
      toast.error("Bạn phải đồng ý với chính sách bảo mật trước khi tiếp tục.");
      return;
    }
    setCapturedFront(null);
    setCapturedBack(null);
    setFaceToken(null);
    setFinalStatus(null);
    setEkycStep(1);
    setIsEkycModalOpen(true);
    setTimeout(() => startCamera(), 300);
  };

  // Gọi Phase 4 API submit-id sau khi có cả 2 mặt CCCD
  const submitIdCard = async (frontDataUrl: string, backDataUrl: string) => {
    setLoading(true);
    try {
      const frontFile = dataUrlToFile(frontDataUrl, "cccd-front.jpg");
      const backFile = dataUrlToFile(backDataUrl, "cccd-back.jpg");

      const res = await verificationApi.submitIdCard(frontFile, backFile);

      if (res.success && res.data?.faceToken) {
        setFaceToken(res.data.faceToken);
        toast.success("Ảnh CCCD đã được xử lý. Bước tiếp theo: chụp khuôn mặt.");
        setEkycStep(3);
        setTimeout(() => startCamera(), 300);
      } else {
        // FPT.AI thành công nhưng không có faceToken → PROCESSING (xét duyệt thủ công)
        toast.info("Hồ sơ đã được gửi. Đang chờ xét duyệt thủ công.");
        setFinalStatus("PROCESSING");
        setEkycStep(5);
        if (onComplete) await onComplete();
      }
    } catch (err: unknown) {
      // Backend ném BusinessException → 400, nhưng đã lưu PROCESSING vào DB
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "";
      if (message.includes("xét duyệt thủ công") || message.includes("PROCESSING")) {
        toast.info("Ảnh không đọc được rõ. Hồ sơ đã được gửi xét duyệt thủ công.");
        setFinalStatus("PROCESSING");
        setEkycStep(5);
        if (onComplete) await onComplete();
      } else {
        toast.error(message || "Lỗi khi xử lý ảnh CCCD. Vui lòng thử lại.");
        // Trở về step 2 để chụp lại
        setEkycStep(2);
        setTimeout(() => startCamera(), 300);
      }
    } finally {
      setLoading(false);
    }
  };

  // Gọi Phase 4 API submit-face sau khi chụp selfie
  const submitSelfie = async (selfieDataUrl: string) => {
    setLoading(true);
    try {
      const selfieFile = dataUrlToFile(selfieDataUrl, "selfie.jpg");
      const token = faceToken ?? "";

      const res = await verificationApi.submitSelfie(selfieFile, token);
      const resultStatus = res.data?.status ?? "PROCESSING";
      setFinalStatus(resultStatus);

      if (resultStatus === "VERIFIED") {
        toast.success("Xác minh khuôn mặt thành công! Tài khoản đã được xác thực.");
      } else if (resultStatus === "REJECTED") {
        toast.error("Khuôn mặt không khớp CCCD. Vui lòng thử lại.");
      } else {
        toast.info("Hồ sơ đang chờ xét duyệt thủ công (1–3 ngày làm việc).");
      }

      setEkycStep(5);
      if (onComplete) await onComplete();
    } catch (err) {
      console.error("Lỗi xác minh khuôn mặt:", err);
      toast.error("Lỗi khi xác minh khuôn mặt. Vui lòng thử lại.");
      setEkycStep(3);
      setTimeout(() => startCamera(), 300);
    } finally {
      setLoading(false);
    }
  };

  const handleEkycNextStep = async () => {
    if (ekycStep === 1) {
      const photo = capturePhoto();
      setCapturedFront(photo);
      setEkycStep(2);
      toast.success("Đã quét mặt trước thẻ căn cước!");
    } else if (ekycStep === 2) {
      const backPhoto = capturePhoto();
      setCapturedBack(backPhoto);
      stopCamera();
      setEkycStep(4); // Processing screen trong khi gọi API
      toast.success("Đã quét mặt sau thẻ căn cước. Đang xử lý...");
      await submitIdCard(capturedFront!, backPhoto);
    } else if (ekycStep === 3) {
      const selfiePhoto = capturePhoto();
      stopCamera();
      setEkycStep(4);
      await submitSelfie(selfiePhoto);
    }
  };

  const closeEkycModal = () => {
    stopCamera();
    setIsEkycModalOpen(false);
    setCapturedFront(null);
    setCapturedBack(null);
    setFaceToken(null);
  };

  return {
    videoRef,
    isEkycModalOpen,
    ekycStep,
    stream,
    capturedFront,
    capturedBack,
    faceToken,
    finalStatus,
    loading,
    startCamera,
    stopCamera,
    capturePhoto,
    handleStartEkyc,
    handleEkycNextStep,
    closeEkycModal,
  };
}
