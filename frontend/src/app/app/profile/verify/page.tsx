"use client";

import { useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Clock,
  Upload,
  Camera,
  ChevronRight,
  CheckCircle2,
  RotateCcw,
  FileImage,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { verificationApi } from "@/lib/api/verification.api";
import { VerificationStatus } from "@/types/verification.types";

type WizardStep = "status" | "front" | "back" | "selfie" | "result";

// ===== Bước hướng dẫn header =====
const STEPS = [
  { label: "Mặt trước CCCD" },
  { label: "Mặt sau CCCD" },
  { label: "Ảnh selfie" },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center gap-2">
            <div
              className={[
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                done
                  ? "bg-blue-600 text-white"
                  : active
                  ? "border-2 border-blue-600 text-blue-600"
                  : "border border-gray-200 text-gray-400",
              ].join(" ")}
            >
              {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={[
                "hidden text-xs sm:block",
                active ? "font-medium text-gray-900" : "text-gray-400",
              ].join(" ")}
            >
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <ChevronRight className="h-4 w-4 text-gray-300" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ===== Upload zone =====
function ImageUploadZone({
  label,
  hint,
  preview,
  onFile,
}: {
  label: string;
  hint: string;
  preview: string | null;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh tối đa 5 MB. Vui lòng chọn ảnh nhỏ hơn.");
      return;
    }
    onFile(file);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        toast.error("Vui lòng chọn file ảnh (JPG, PNG, WebP).");
        return;
      }
      onFile(file);
    },
    [onFile]
  );

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      {preview ? (
        <div className="relative h-44 w-full overflow-hidden rounded-xl border border-gray-200">
          <Image
            src={preview}
            alt={label}
            fill
            className="object-contain"
            unoptimized
          />
          <button
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-gray-700 border border-gray-200 hover:bg-white"
          >
            <RotateCcw className="h-3 w-3" />
            Đổi ảnh
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="flex h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-center transition-colors hover:border-blue-300 hover:bg-blue-50/30"
        >
          <FileImage className="h-8 w-8 text-gray-300" />
          <div>
            <p className="text-sm font-medium text-gray-600">
              Nhấn để chọn hoặc kéo thả ảnh
            </p>
            <p className="text-xs text-gray-400">{hint}</p>
          </div>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}

// ===== Màn hình kết quả =====
function ResultScreen({
  status,
  message,
  onRetry,
}: {
  status: VerificationStatus;
  message: string;
  onRetry: () => void;
}) {
  if (status === "VERIFIED") {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
          <ShieldCheck className="h-8 w-8 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Xác minh thành công!</h3>
          <p className="mt-1 text-sm text-gray-500">{message}</p>
        </div>
        <span className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
          Tài khoản đã được gắn Verified badge
        </span>
      </div>
    );
  }

  if (status === "PROCESSING") {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
          <Clock className="h-8 w-8 text-amber-500" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Đang xét duyệt</h3>
          <p className="mt-1 text-sm text-gray-500">{message}</p>
        </div>
      </div>
    );
  }

  if (status === "REJECTED") {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <ShieldX className="h-8 w-8 text-red-500" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Xác minh thất bại</h3>
          <p className="mt-1 text-sm text-gray-500">{message}</p>
        </div>
        <button
          onClick={onRetry}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <RotateCcw className="h-4 w-4" />
          Thử lại từ đầu
        </button>
      </div>
    );
  }

  return null;
}

// ===== Main page =====
export default function VerifyPage() {
  const { data: session } = useSession();
  const prefersReduced = useReducedMotion();

  const [step, setStep] = useState<WizardStep>("status");
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [faceToken, setFaceToken] = useState<string>("");
  const [resultStatus, setResultStatus] = useState<VerificationStatus | null>(null);
  const [resultMessage, setResultMessage] = useState<string>("");

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ["verification-status"],
    queryFn: verificationApi.getStatus,
    enabled: !!session,
    refetchOnWindowFocus: false,
  });

  const submitIdMutation = useMutation({
    mutationFn: ({ front, back }: { front: File; back: File }) =>
      verificationApi.submitIdCard(front, back),
    onSuccess: (res) => {
      const data = res.data;
      setFaceToken(data.faceToken);
      toast.success(`Đọc CCCD thành công. Tên: ${data.fullName} (${data.maskedId})`);
      setStep("selfie");
    },
    onError: () => {
      toast.error("Không thể xử lý ảnh CCCD. Vui lòng chụp lại rõ nét hơn.");
    },
  });

  const submitSelfieMutation = useMutation({
    mutationFn: ({ selfie, token }: { selfie: File; token: string }) =>
      verificationApi.submitSelfie(selfie, token),
    onSuccess: (res) => {
      const data = res.data;
      setResultStatus(data.status);
      setResultMessage(data.message);
      setStep("result");
    },
    onError: () => {
      toast.error("Gửi ảnh selfie thất bại. Vui lòng thử lại.");
    },
  });

  const setFileWithPreview = (
    file: File,
    setter: (f: File) => void,
    previewSetter: (url: string) => void
  ) => {
    setter(file);
    const url = URL.createObjectURL(file);
    previewSetter(url);
  };

  const handleStartVerify = () => setStep("front");

  const handleFrontNext = () => {
    if (!frontFile) {
      toast.error("Vui lòng chọn ảnh mặt trước CCCD.");
      return;
    }
    setStep("back");
  };

  const handleBackSubmit = () => {
    if (!backFile) {
      toast.error("Vui lòng chọn ảnh mặt sau CCCD.");
      return;
    }
    if (!frontFile) return;
    submitIdMutation.mutate({ front: frontFile, back: backFile });
  };

  const handleSelfieSubmit = () => {
    if (!selfieFile) {
      toast.error("Vui lòng chọn ảnh selfie của bạn.");
      return;
    }
    submitSelfieMutation.mutate({ selfie: selfieFile, token: faceToken });
  };

  const handleRetry = () => {
    setStep("front");
    setFrontFile(null);
    setBackFile(null);
    setSelfieFile(null);
    setFrontPreview(null);
    setBackPreview(null);
    setSelfiePreview(null);
    setFaceToken("");
    setResultStatus(null);
    setResultMessage("");
  };

  const currentVerification = statusData?.data;
  const alreadyVerified = currentVerification?.status === "VERIFIED";
  const isProcessing = currentVerification?.status === "PROCESSING";

  const stepIndex =
    step === "front" ? 0 : step === "back" ? 1 : step === "selfie" ? 2 : -1;

  const animProps = prefersReduced
    ? {}
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
      };

  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Xác minh danh tính
          </h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Giúp người thuê tin tưởng hơn vào thông tin của bạn.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white">
          {statusLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
            </div>
          ) : step === "status" ? (
            <AnimatePresence mode="wait">
              <motion.div key="status-screen" {...animProps} className="p-6">
                {alreadyVerified ? (
                  <div className="flex flex-col items-center gap-4 py-6 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
                      <ShieldCheck className="h-7 w-7 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-900">
                        Tài khoản đã được xác minh
                      </h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Tên: {currentVerification?.fullName} &middot;{" "}
                        {currentVerification?.maskedId}
                      </p>
                    </div>
                  </div>
                ) : isProcessing ? (
                  <div className="flex flex-col items-center gap-4 py-6 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
                      <Clock className="h-7 w-7 text-amber-500" />
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-900">
                        Hồ sơ đang được xét duyệt
                      </h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Ban quản trị sẽ phản hồi trong 1-3 ngày làm việc.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {currentVerification?.status === "REJECTED" && (
                      <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
                        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                        <div>
                          <p className="text-sm font-medium text-red-800">
                            Hồ sơ trước đó bị từ chối
                          </p>
                          {currentVerification.rejectionReason && (
                            <p className="mt-0.5 text-xs text-red-600">
                              {currentVerification.rejectionReason}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Hướng dẫn */}
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-700">
                        Bạn sẽ cần chuẩn bị:
                      </p>
                      <ul className="space-y-2">
                        {[
                          "Ảnh chụp mặt trước CCCD / CMND rõ nét",
                          "Ảnh chụp mặt sau CCCD / CMND rõ nét",
                          "Ảnh selfie khuôn mặt (không đeo kính, đủ ánh sáng)",
                        ].map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-2 text-sm text-gray-600"
                          >
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={handleStartVerify}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Bắt đầu xác minh
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          ) : step === "result" && resultStatus ? (
            <AnimatePresence mode="wait">
              <motion.div key="result" {...animProps} className="p-6">
                <ResultScreen
                  status={resultStatus}
                  message={resultMessage}
                  onRetry={handleRetry}
                />
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="p-6 space-y-6">
              {/* Step indicator */}
              <StepIndicator current={stepIndex} />

              <div className="border-t border-gray-100 pt-6">
                <AnimatePresence mode="wait">
                  {/* Bước 1: Mặt trước */}
                  {step === "front" && (
                    <motion.div key="front" {...animProps} className="space-y-5">
                      <div className="space-y-1">
                        <h2 className="font-bold text-gray-900">
                          Bước 1: Ảnh mặt trước CCCD
                        </h2>
                        <p className="text-xs text-gray-500">
                          Chụp rõ toàn bộ mặt trước thẻ CCCD/CMND, không bị che.
                        </p>
                      </div>
                      <ImageUploadZone
                        label="Mặt trước CCCD"
                        hint="JPG, PNG, WebP — tối đa 5 MB"
                        preview={frontPreview}
                        onFile={(f) =>
                          setFileWithPreview(f, setFrontFile, setFrontPreview)
                        }
                      />
                      <button
                        disabled={!frontFile}
                        onClick={handleFrontNext}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Tiếp theo
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </motion.div>
                  )}

                  {/* Bước 2: Mặt sau */}
                  {step === "back" && (
                    <motion.div key="back" {...animProps} className="space-y-5">
                      <div className="space-y-1">
                        <h2 className="font-bold text-gray-900">
                          Bước 2: Ảnh mặt sau CCCD
                        </h2>
                        <p className="text-xs text-gray-500">
                          Chụp rõ toàn bộ mặt sau thẻ CCCD/CMND, bao gồm vân tay
                          và mã vạch.
                        </p>
                      </div>
                      <ImageUploadZone
                        label="Mặt sau CCCD"
                        hint="JPG, PNG, WebP — tối đa 5 MB"
                        preview={backPreview}
                        onFile={(f) =>
                          setFileWithPreview(f, setBackFile, setBackPreview)
                        }
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => setStep("front")}
                          className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Quay lại
                        </button>
                        <button
                          disabled={!backFile || submitIdMutation.isPending}
                          onClick={handleBackSubmit}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {submitIdMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Đang xử lý...
                            </>
                          ) : (
                            <>
                              Gửi CCCD
                              <Upload className="h-4 w-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Bước 3: Selfie */}
                  {step === "selfie" && (
                    <motion.div key="selfie" {...animProps} className="space-y-5">
                      <div className="space-y-1">
                        <h2 className="font-bold text-gray-900">
                          Bước 3: Ảnh selfie khuôn mặt
                        </h2>
                        <p className="text-xs text-gray-500">
                          Nhìn thẳng vào camera, đủ ánh sáng, không đeo kính hoặc
                          mũ che mặt.
                        </p>
                      </div>
                      <ImageUploadZone
                        label="Ảnh selfie"
                        hint="Chụp ảnh selfie rõ nét, đủ ánh sáng"
                        preview={selfiePreview}
                        onFile={(f) =>
                          setFileWithPreview(f, setSelfieFile, setSelfiePreview)
                        }
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => setStep("back")}
                          className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Quay lại
                        </button>
                        <button
                          disabled={!selfieFile || submitSelfieMutation.isPending}
                          onClick={handleSelfieSubmit}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {submitSelfieMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Đang xác minh...
                            </>
                          ) : (
                            <>
                              Xác minh ngay
                              <Camera className="h-4 w-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {/* Cam kết bảo mật */}
        <p className="mt-4 text-center text-xs text-gray-400">
          Thông tin định danh được mã hóa và bảo mật. Chúng tôi không lưu ảnh
          gốc của bạn.
        </p>
      </div>
    </div>
  );
}
