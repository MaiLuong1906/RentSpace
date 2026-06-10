"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { depositApi } from "@/lib/api/deposit.api";
import { Loader2, ShieldCheck, AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function CheckoutPage() {
  const params = useParams();
  const id = Number(params.id);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || isNaN(id)) {
      setTimeout(() => {
        setError("Mã đặt cọc không hợp lệ.");
        setIsLoading(false);
      }, 0);
      return;
    }

    const initiatePaymentFlow = async () => {
      try {
        const response = await depositApi.initiatePayment(id);
        if (response.success && response.data?.paymentUrl) {
          toast.success("Đang chuyển hướng đến cổng thanh toán VNPay...");
          // Redirect to VNPay payment URL
          window.location.href = response.data.paymentUrl;
        } else {
          setError(response.message || "Không thể tạo liên kết thanh toán.");
        }
      } catch (err: unknown) {
        console.error("Initiate payment error:", err);
        const apiError = err as { response?: { data?: { message?: string } } };
        setError(apiError.response?.data?.message || "Lỗi kết nối hệ thống thanh toán.");
      } finally {
        setIsLoading(false);
      }
    };

    initiatePaymentFlow();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50/50 p-4">
        <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          <div className="relative flex justify-center">
            <div className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-emerald-50 animate-ping" />
            <div className="relative p-4 bg-emerald-50 rounded-full text-emerald-600">
              <ShieldCheck className="h-8 w-8" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900">Đang chuẩn bị cổng thanh toán</h2>
            <p className="text-sm text-gray-500">
              Vui lòng giữ kết nối. Hệ thống đang bảo mật giao dịch và chuyển sang VNPay.
            </p>
          </div>
          <div className="flex justify-center pt-2">
            <Loader2 className="h-6 w-6 text-emerald-600 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50/50 p-4">
        <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-2xl shadow-xl border border-red-50">
          <div className="flex justify-center">
            <div className="p-4 bg-red-50 rounded-full text-red-600">
              <AlertCircle className="h-8 w-8" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900">Không thể thực hiện thanh toán</h2>
            <p className="text-sm text-red-500 font-medium">{error}</p>
          </div>
          <div className="flex flex-col gap-3 pt-4">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Thử lại
            </button>
            <Link
              href="/app/deposits"
              className="inline-flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 font-semibold"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Quay lại lịch sử đặt cọc</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
