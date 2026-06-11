import { useState, useRef } from "react";
import { kycApi } from "@/lib/api/kyc.api";
import { toast } from "sonner";

interface UseEkycProps {
  onComplete?: () => Promise<void> | void;
}

export function useEkyc({ onComplete }: UseEkycProps = {}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isEkycModalOpen, setIsEkycModalOpen] = useState(false);
  const [ekycStep, setEkycStep] = useState<1 | 2 | 3 | 4 | 5>(1); // 1: Front, 2: Back, 3: Selfie, 4: Processing, 5: Done
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedFront, setCapturedFront] = useState<string | null>(null);
  const [capturedBack, setCapturedBack] = useState<string | null>(null);
  const [ekycSessionId, setEkycSessionId] = useState<string | null>(null);
  const [simulationMode, setSimulationMode] = useState<"SUCCESS" | "NEED_REVIEW" | "FAIL">("SUCCESS");
  const [loading, setLoading] = useState(false);

  // Khởi động Camera stream
  const startCamera = async () => {
    try {
      stopCamera();
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
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

  // Tắt camera stream
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // Chụp ảnh từ video stream hoặc trả về ảnh mock nếu camera bị lỗi
  const capturePhoto = () => {
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
    // Fallback: Mock base64 image representation
    return "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
  };

  // Khởi chạy tiến trình eKYC
  const handleStartEkyc = async (consentChecked: boolean) => {
    if (!consentChecked) {
      toast.error("Bạn phải đồng ý với chính sách bảo mật trước khi tiếp tục.");
      return;
    }
    try {
      setLoading(true);
      const res = await kycApi.initEkyc();
      if (res.success && res.data) {
        setEkycSessionId(res.data.sessionId);
        setEkycStep(1);
        setIsEkycModalOpen(true);
        // Bật camera
        setTimeout(() => {
          startCamera();
        }, 300);
      } else {
        toast.error(res.message || "Không thể khởi tạo phiên eKYC.");
      }
    } catch (err) {
      console.error("Lỗi khởi tạo eKYC:", err);
      toast.error("Lỗi kết nối khi khởi tạo phiên eKYC.");
    } finally {
      setLoading(false);
    }
  };

  // Gửi kết quả eKYC về Backend
  const submitEkycData = async (selfiePhoto: string) => {
    if (!ekycSessionId) return;
    try {
      const payload = {
        sessionId: ekycSessionId,
        cccdFrontImage: capturedFront || "data:image/jpeg;base64,mock_front",
        cccdBackImage: capturedBack || "data:image/jpeg;base64,mock_back",
        faceImage: selfiePhoto,
        simulationMode: simulationMode,
        ocrData: {
          idNumber: "037195009876",
          fullName: "NGUYỄN VĂN A",
          dateOfBirth: "20/09/1995",
          gender: "Nam",
          hometown: "TP. Hồ Chí Minh"
        }
      };

      const res = await kycApi.completeEkyc(payload);
      if (res.success) {
        toast.success("Hoàn tất đối soát eKYC thành công!");
        setEkycStep(5);
        if (onComplete) await onComplete();
      } else {
        toast.error(res.message || "Xác thực eKYC không thành công.");
        setEkycStep(5);
        if (onComplete) await onComplete();
      }
    } catch (err) {
      console.error("Lỗi hoàn tất eKYC:", err);
      toast.error("Đã xảy ra lỗi trong quá trình đối soát eKYC.");
      setEkycStep(5);
      if (onComplete) await onComplete();
    }
  };

  // Đi tới bước tiếp theo trong eKYC
  const handleEkycNextStep = () => {
    const photo = capturePhoto();
    if (ekycStep === 1) {
      setCapturedFront(photo);
      setEkycStep(2);
      toast.success("Đã quét mặt trước thẻ căn cước!");
    } else if (ekycStep === 2) {
      setCapturedBack(photo);
      setEkycStep(3);
      toast.success("Đã quét mặt sau thẻ căn cước!");
    } else if (ekycStep === 3) {
      setEkycStep(4);
      stopCamera();
      // Bắt đầu gửi dữ liệu hoàn tất eKYC
      submitEkycData(photo);
    }
  };

  // Đóng modal eKYC
  const closeEkycModal = () => {
    stopCamera();
    setIsEkycModalOpen(false);
    setCapturedFront(null);
    setCapturedBack(null);
  };

  return {
    videoRef,
    isEkycModalOpen,
    ekycStep,
    stream,
    capturedFront,
    capturedBack,
    ekycSessionId,
    simulationMode,
    setSimulationMode,
    loading,
    startCamera,
    stopCamera,
    capturePhoto,
    handleStartEkyc,
    handleEkycNextStep,
    closeEkycModal
  };
}
