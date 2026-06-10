"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, ShieldCheck, ArrowRight, Home, CreditCard } from "lucide-react";

function PaymentResultInner() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"success" | "failed" | "loading">("loading");
  
  const responseCode = searchParams.get("vnp_ResponseCode");
  const txnRef = searchParams.get("vnp_TxnRef");
  const amountStr = searchParams.get("vnp_Amount");
  const transactionNo = searchParams.get("vnp_BankCode");
  
  const amount = amountStr ? Number(amountStr) / 100 : 0; // VNPay multiplies by 100

  useEffect(() => {
    if (responseCode) {
      if (responseCode === "00") {
        setTimeout(() => setStatus("success"), 0);
      } else {
        setTimeout(() => setStatus("failed"), 0);
      }
    } else {
      setTimeout(() => setStatus("failed"), 0);
    }
  }, [responseCode]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
  };

  if (status === "success") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-emerald-50 overflow-hidden transform transition-all duration-350 scale-100 hover:shadow-2xl">
          {/* Header Banner */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-6 py-8 text-center text-white relative">
            <div className="absolute top-3 right-3 opacity-15">
              <ShieldCheck size={120} />
            </div>
            <div className="inline-flex p-3 bg-white/20 backdrop-blur-md rounded-full mb-3 text-white">
              <CheckCircle className="h-10 w-10 text-white fill-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Thanh Toán Thành Công</h1>
            <p className="text-emerald-100 text-xs mt-1 font-medium">Giao dịch đã được hệ thống ký xác thực</p>
          </div>

          <div className="p-8 space-y-6">
            {/* Payment Details Card */}
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-3.5 text-sm">
              <div className="flex justify-between items-center text-gray-500">
                <span>Mã giao dịch đặt cọc:</span>
                <span className="font-bold text-gray-800">#{txnRef || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center text-gray-500">
                <span>Ngân hàng thanh toán:</span>
                <span className="font-semibold text-gray-800">{transactionNo || "NCB"}</span>
              </div>
              <div className="flex justify-between items-center text-gray-500 border-t border-dashed border-gray-200 pt-3">
                <span className="text-gray-700 font-medium">Số tiền đã đặt cọc:</span>
                <span className="text-lg font-extrabold text-emerald-600">{formatPrice(amount)}</span>
              </div>
            </div>

            {/* Escrow Guarantee Text */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                <strong>Đảm bảo an toàn:</strong> Tiền đặt cọc của bạn đang được RentSpace phong tỏa giữ hộ. 
                Chủ nhà sẽ chỉ nhận được tiền khi bạn xác nhận đã dọn vào phòng thành công (hoặc sau 7 ngày kể từ ngày nhận phòng).
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3 pt-2">
              <Link 
                href="/app/deposits"
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100"
              >
                <span>Quản lý đặt cọc</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/app"
                className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-750 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                <Home className="h-4 w-4" />
                <span>Về trang chủ</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-red-50 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-br from-red-500 to-rose-600 px-6 py-8 text-center text-white">
          <div className="inline-flex p-3 bg-white/20 backdrop-blur-md rounded-full mb-3 text-white">
            <XCircle className="h-10 w-10 text-white fill-red-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Thanh Toán Thất Bại</h1>
          <p className="text-red-100 text-xs mt-1 font-medium">Giao dịch không thành công hoặc đã bị hủy bỏ</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-red-50/50 border border-red-100 rounded-2xl p-5 text-center space-y-2">
            <p className="text-sm text-red-700 font-semibold">
              Mã lỗi giao dịch: {responseCode || "Hủy giao dịch"}
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Thanh toán của bạn đã bị từ chối hoặc người dùng hủy thao tác trên cổng VNPay. 
              Vui lòng thực hiện thanh toán lại hoặc liên hệ bộ phận hỗ trợ nếu tài khoản của bạn đã bị trừ tiền.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            {txnRef ? (
              <Link 
                href={`/app/checkout/${txnRef}`}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
              >
                <CreditCard className="h-4 w-4" />
                <span>Thanh toán lại</span>
              </Link>
            ) : null}
            <Link
              href="/app/deposits"
              className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-750 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              <span>Xem lịch sử đặt cọc</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="text-sm text-gray-500">Đang kiểm tra kết quả thanh toán...</p>
        </div>
      </div>
    }>
      <PaymentResultInner />
    </Suspense>
  );
}
