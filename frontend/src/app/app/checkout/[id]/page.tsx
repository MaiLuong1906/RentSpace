"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { depositApi } from "@/lib/api/deposit.api";
import { DepositTransaction } from "@/types/phase2.types";
import {
  Loader2,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

type PaymentMethod = "VNPAY" | "MOMO";

const PAYMENT_METHODS: {
  id: PaymentMethod;
  name: string;
  description: string;
  badge: string;
  badgeColor: string;
  gradient: string;
  borderActive: string;
  bgActive: string;
  svgContent: React.ReactNode;
}[] = [
  {
    id: "VNPAY",
    name: "VNPay",
    description: "Thẻ ATM, Visa, Master, QR Code",
    badge: "Phổ biến",
    badgeColor: "bg-blue-100 text-blue-700",
    gradient: "from-blue-500 to-indigo-600",
    borderActive: "border-blue-500",
    bgActive: "bg-blue-50",
    svgContent: (
      <svg viewBox="0 0 48 24" className="h-7 w-auto" fill="none">
        <rect width="48" height="24" rx="4" fill="#0066CC" />
        <text x="50%" y="60%" dominantBaseline="middle" textAnchor="middle"
          fill="white" fontSize="8" fontWeight="bold" fontFamily="Arial">
          VNPAY
        </text>
      </svg>
    ),
  },
  {
    id: "MOMO",
    name: "MoMo",
    description: "Ví điện tử MoMo, QR Code",
    badge: "Mới",
    badgeColor: "bg-pink-100 text-pink-700",
    gradient: "from-pink-500 to-rose-500",
    borderActive: "border-pink-500",
    bgActive: "bg-pink-50",
    svgContent: (
      <svg viewBox="0 0 48 24" className="h-7 w-auto" fill="none">
        <rect width="48" height="24" rx="4" fill="#AE2070" />
        <text x="50%" y="60%" dominantBaseline="middle" textAnchor="middle"
          fill="white" fontSize="8" fontWeight="bold" fontFamily="Arial">
          MoMo
        </text>
      </svg>
    ),
  },
];

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

export default function CheckoutPage() {
  const params = useParams();
  const id = Number(params.id);

  const [deposit, setDeposit] = useState<DepositTransaction | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("VNPAY");
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tải thông tin giao dịch đặt cọc
  useEffect(() => {
    if (!id || isNaN(id)) {
      const timer = setTimeout(() => {
        setError("Mã đặt cọc không hợp lệ.");
        setIsLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    const loadDeposit = async () => {
      try {
        const res = await depositApi.getDepositById(id);
        if (res.success && res.data) {
          if (res.data.status !== "PENDING_PAYMENT") {
            setError(`Giao dịch này không thể thanh toán (trạng thái: ${res.data.status}).`);
          } else {
            setDeposit(res.data);
          }
        } else {
          setError(res.message || "Không tìm thấy giao dịch đặt cọc.");
        }
      } catch {
        setError("Lỗi kết nối — không thể tải thông tin giao dịch.");
      } finally {
        setIsLoading(false);
      }
    };

    loadDeposit();
  }, [id]);

  const handlePay = async () => {
    if (!deposit) return;
    setIsPaying(true);
    try {
      const res = await depositApi.initiatePayment(id, selectedMethod);
      if (res.success && res.data?.paymentUrl) {
        toast.success(
          `Đang chuyển hướng đến cổng thanh toán ${selectedMethod}...`,
          { duration: 2000 }
        );
        setTimeout(() => {
          window.location.href = res.data!.paymentUrl;
        }, 500);
      } else {
        toast.error(res.message || "Không thể tạo liên kết thanh toán.");
        setIsPaying(false);
      }
    } catch (err: unknown) {
      // Phân biệt lỗi từ backend (có response) vs lỗi mạng (không có response)
      const axiosError = err as { response?: { data?: { message?: string }; status?: number } };
      if (axiosError?.response?.data?.message) {
        // Lỗi từ backend — hiển thị message cụ thể
        toast.error(`Lỗi: ${axiosError.response.data.message}`);
      } else if (axiosError?.response?.status) {
        // Lỗi HTTP không có message
        toast.error(`Lỗi hệ thống (${axiosError.response.status}). Vui lòng thử lại.`);
      } else {
        // Lỗi mạng thực sự (backend không chạy, timeout...)
        toast.error("Không thể kết nối đến máy chủ. Kiểm tra backend đang chạy.");
      }
      setIsPaying(false);
    }
  };


  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50/50 p-4">
        <div className="max-w-md w-full text-center space-y-5 bg-white p-10 rounded-3xl shadow-xl border border-gray-100">
          <div className="relative flex justify-center">
            <div className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-emerald-50 animate-ping opacity-60" />
            <div className="relative p-4 bg-emerald-50 rounded-full text-emerald-600">
              <ShieldCheck className="h-8 w-8" />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-gray-900">Đang tải thông tin giao dịch...</h2>
            <p className="text-sm text-gray-400">Vui lòng chờ trong giây lát.</p>
          </div>
          <Loader2 className="h-5 w-5 text-emerald-500 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50/50 p-4">
        <div className="max-w-md w-full text-center space-y-5 bg-white p-10 rounded-3xl shadow-xl border border-red-50">
          <div className="flex justify-center">
            <div className="p-4 bg-red-50 rounded-full text-red-500">
              <AlertCircle className="h-8 w-8" />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-gray-900">Không thể thực hiện thanh toán</h2>
            <p className="text-sm text-red-500 font-medium">{error}</p>
          </div>
          <Link
            href="/app/deposits"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 font-semibold text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại lịch sử đặt cọc
          </Link>
        </div>
      </div>
    );
  }

  const selected = PAYMENT_METHODS.find((m) => m.id === selectedMethod)!;

  // ── Main UI ──
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100 p-4 py-10">
      <div className="w-full max-w-lg space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <Link href="/app/deposits" className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Thanh toán đặt cọc</h1>
            <p className="text-xs text-gray-400">Chọn phương thức và xác nhận thanh toán</p>
          </div>
        </div>

        {/* Deposit summary card */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${selected.gradient} text-white shadow-md`}>
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Tóm tắt giao dịch</p>
              <p className="text-sm font-bold text-gray-800">Mã đặt cọc #{deposit?.id}</p>
            </div>
          </div>

          <div className="divide-y divide-dashed divide-gray-100 text-sm">
            <div className="flex justify-between py-2.5 text-gray-500">
              <span>Tiền đặt cọc</span>
              <span className="font-semibold text-gray-800">{formatPrice(deposit?.amount ?? 0)}</span>
            </div>
            <div className="flex justify-between py-2.5 text-gray-500">
              <span>Phí nền tảng (2%)</span>
              <span className="font-semibold text-gray-800">- {formatPrice(deposit?.platformFee ?? 0)}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="font-bold text-gray-700">Chủ nhà nhận được</span>
              <span className="font-extrabold text-emerald-600">{formatPrice(deposit?.netAmount ?? 0)}</span>
            </div>
            <div className="flex justify-between py-2.5 font-bold">
              <span className="text-gray-900">Bạn cần thanh toán</span>
              <span className="text-2xl text-blue-600">{formatPrice(deposit?.amount ?? 0)}</span>
            </div>
          </div>
        </div>

        {/* Payment method selector */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 space-y-4">
          <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">Chọn phương thức thanh toán</p>

          <div className="grid grid-cols-2 gap-3">
            {PAYMENT_METHODS.map((method) => {
              const isActive = selectedMethod === method.id;
              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`relative flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer
                    ${isActive
                      ? `${method.borderActive} ${method.bgActive} shadow-md scale-[1.02]`
                      : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white"
                    }`}
                >
                  {/* Badge */}
                  <span className={`absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${method.badgeColor}`}>
                    {method.badge}
                  </span>

                  {/* Logo */}
                  <div className="mt-1">{method.svgContent}</div>

                  <div className="text-center space-y-0.5">
                    <p className={`text-sm font-bold ${isActive ? "text-gray-900" : "text-gray-600"}`}>
                      {method.name}
                    </p>
                    <p className="text-[11px] text-gray-400 leading-tight">{method.description}</p>
                  </div>

                  {/* Active check */}
                  {isActive && (
                    <div className={`absolute bottom-2 right-2 p-0.5 rounded-full bg-gradient-to-br ${method.gradient}`}>
                      <CheckCircle className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Security note */}
        <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
          <Lock className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-700 leading-relaxed">
            <strong>An toàn 100%:</strong> Tiền đặt cọc của bạn được giữ trong tài khoản Escrow bảo mật của RentSpace.
            Chủ nhà chỉ nhận tiền sau khi bạn xác nhận đã dọn vào phòng thành công.
          </p>
        </div>

        {/* Pay button */}
        <button
          onClick={handlePay}
          disabled={isPaying}
          className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-white text-base
            bg-gradient-to-r ${selected.gradient} shadow-lg hover:shadow-xl hover:opacity-95
            transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]`}
        >
          {isPaying ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Đang kết nối {selected.name}...</span>
            </>
          ) : (
            <>
              <span>Thanh toán qua {selected.name}</span>
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>

        <p className="text-center text-xs text-gray-400 pb-2">
          Bằng cách nhấn thanh toán, bạn đồng ý với{" "}
          <Link href="/terms" className="text-blue-500 hover:underline">Điều khoản sử dụng</Link>{" "}
          của RentSpace.
        </p>
      </div>
    </div>
  );
}
