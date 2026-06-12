"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, ShieldCheck, ArrowRight, Home, CreditCard, Sparkles } from "lucide-react";
import apiClient from "@/lib/api/axios";

function PaymentResultInner() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"success" | "failed" | "loading">("loading");
  
  const responseCode = searchParams.get("vnp_ResponseCode");
  const txnRef = searchParams.get("vnp_TxnRef");
  const amountStr = searchParams.get("vnp_Amount");
  const transactionNo = searchParams.get("vnp_BankCode");
  
  const amount = amountStr ? Number(amountStr) / 100 : 0; // VNPay multiplies by 100

  useEffect(() => {
    const triggerWebhookAndVerify = async () => {
      try {
        // Collect all query parameters from searchParams
        const params: Record<string, string> = {};
        searchParams.forEach((value, key) => {
          params[key] = value;
        });

        // Call backend webhook to update the transaction status
        // Since localhost webhook isn't directly reachable by VNPay in local test,
        // calling it here ensures the database updates on redirect.
        await apiClient.get("/deposits/webhook/vnpay", { params });
        
        if (responseCode === "00") {
          setTimeout(() => setStatus("success"), 0);
        } else {
          setTimeout(() => setStatus("failed"), 0);
        }
      } catch (error) {
        console.error("Error triggering payment webhook:", error);
        setTimeout(() => setStatus("failed"), 0);
      }
    };

    if (responseCode) {
      triggerWebhookAndVerify();
    } else {
      setTimeout(() => setStatus("failed"), 0);
    }
  }, [responseCode, searchParams]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
  };

  if (status === "loading") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center space-y-4 border border-gray-100">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <h2 className="text-lg font-bold text-gray-800">Đang kiểm tra kết quả thanh toán...</h2>
          <p className="text-xs text-gray-400">Vui lòng không đóng trình duyệt hoặc tải lại trang.</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    const isPromote = txnRef?.startsWith("PROMOTE_");
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-emerald-50 overflow-hidden transform transition-all duration-350 scale-100 hover:shadow-2xl">
          {/* Header Banner */}
          <div className={`bg-gradient-to-br ${isPromote ? "from-amber-500 to-orange-600" : "from-emerald-500 to-teal-600"} px-6 py-8 text-center text-white relative`}>
            <div className="absolute top-3 right-3 opacity-15">
              {isPromote ? <Sparkles size={120} /> : <ShieldCheck size={120} />}
            </div>
            <div className="inline-flex p-3 bg-white/20 backdrop-blur-md rounded-full mb-3 text-white">
              {isPromote ? (
                <Sparkles className="h-10 w-10 text-white fill-amber-500" />
              ) : (
                <CheckCircle className="h-10 w-10 text-white fill-emerald-500" />
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isPromote ? "Đẩy Tin Nổi Bật Thành Công" : "Thanh Toán Thành Công"}
            </h1>
            <p className="text-white/90 text-xs mt-1 font-medium">
              {isPromote ? "Tin đăng của bạn đã được gắn nhãn nổi bật" : "Giao dịch đã được hệ thống ký xác thực"}
            </p>
          </div>

          <div className="p-8 space-y-6">
            {/* Payment Details Card */}
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-3.5 text-sm">
              <div className="flex justify-between items-center text-gray-500">
                <span>{isPromote ? "Mã giao dịch đẩy tin:" : "Mã giao dịch đặt cọc:"}</span>
                <span className="font-bold text-gray-800">#{txnRef || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center text-gray-500">
                <span>Ngân hàng thanh toán:</span>
                <span className="font-semibold text-gray-800">{transactionNo || "NCB"}</span>
              </div>
              <div className="flex justify-between items-center text-gray-500 border-t border-dashed border-gray-200 pt-3">
                <span className="text-gray-700 font-medium">Số tiền thanh toán:</span>
                <span className={`text-lg font-extrabold ${isPromote ? "text-amber-600" : "text-emerald-600"}`}>{formatPrice(amount)}</span>
              </div>
            </div>

            {/* Note box */}
            {isPromote ? (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
                <Sparkles className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  <strong>Ưu tiên hiển thị:</strong> Tin đăng của bạn hiện đã được đưa lên vị trí đầu tiên của kết quả tìm kiếm/lọc phòng và có nhãn nổi bật giúp tiếp cận hàng nghìn khách thuê.
                </p>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                  <strong>Đảm bảo an toàn:</strong> Tiền đặt cọc của bạn đang được RentSpace phong tỏa giữ hộ. 
                  Chủ nhà sẽ chỉ nhận được tiền khi bạn xác nhận đã dọn vào phòng thành công (hoặc sau 7 ngày kể từ ngày nhận phòng).
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-3 pt-2">
              <Link 
                href={isPromote ? "/app/landlord/my-listings" : "/app/deposits"}
                className={`w-full flex items-center justify-center gap-2 ${isPromote ? "bg-amber-500 hover:bg-amber-600 shadow-amber-100" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100"} text-white py-3 rounded-xl font-bold transition-colors shadow-lg`}
              >
                <span>{isPromote ? "Quản lý tin đăng" : "Quản lý đặt cọc"}</span>
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
                href={txnRef.startsWith("PROMOTE_") ? "/app/landlord/my-listings" : `/app/checkout/${txnRef}`}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
              >
                <CreditCard className="h-4 w-4" />
                <span>{txnRef.startsWith("PROMOTE_") ? "Quay lại tin đăng" : "Thanh toán lại"}</span>
              </Link>
            ) : null}
            <Link
              href="/app"
              className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-750 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              <span>Về trang chủ</span>
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
          <p className="text-sm text-gray-500 font-semibold">Đang tải kết quả...</p>
        </div>
      </div>
    }>
      <PaymentResultInner />
    </Suspense>
  );
}
