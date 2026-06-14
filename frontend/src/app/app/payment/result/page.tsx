"use client";

import React, { useEffect, useState, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle,
  XCircle,
  ShieldCheck,
  ArrowRight,
  Home,
  CreditCard,
  Sparkles,
  Loader2,
  Clock,
} from "lucide-react";
import apiClient from "@/lib/api/axios";

// ── Kiểu nguồn callback ──
type GatewaySource = "VNPAY" | "MOMO" | "UNKNOWN";
type PaymentStatus = "loading" | "success" | "failed";

function detectGateway(searchParams: URLSearchParams): GatewaySource {
  if (searchParams.get("vnp_ResponseCode")) return "VNPAY";
  // MoMo callback có param resultCode hoặc orderId không bắt đầu bằng vnp_
  if (searchParams.get("resultCode") !== null || searchParams.get("orderId")) return "MOMO";
  return "UNKNOWN";
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
}

function PaymentResultInner() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<PaymentStatus>("loading");
  const [countdown, setCountdown] = useState(5);
  const [gateway, setGateway] = useState<GatewaySource>("UNKNOWN");

  // ── VNPay params ──
  const vnpResponseCode = searchParams.get("vnp_ResponseCode");
  const vnpTxnRef = searchParams.get("vnp_TxnRef");
  const vnpAmountStr = searchParams.get("vnp_Amount");
  const vnpBankCode = searchParams.get("vnp_BankCode");
  const vnpAmount = vnpAmountStr ? Number(vnpAmountStr) / 100 : 0;

  // ── MoMo params ──
  const momoResultCode = searchParams.get("resultCode");
  const momoOrderId = searchParams.get("orderId");
  const momoAmountStr = searchParams.get("amount");
  const momoTransId = searchParams.get("transId");
  const momoAmount = momoAmountStr ? Number(momoAmountStr) : 0;

  const triggerWebhook = useCallback(async () => {
    const detected = detectGateway(searchParams);
    setGateway(detected);

    try {
      const params: Record<string, string> = {};
      searchParams.forEach((v, k) => { params[k] = v; });

      if (detected === "VNPAY") {
        // Kích hoạt webhook VNPay qua GET (cập nhật DB khi test local)
        await apiClient.get("/deposits/webhook/vnpay", { params });
        setStatus(vnpResponseCode === "00" ? "success" : "failed");

      } else if (detected === "MOMO") {
        // Kích hoạt webhook MoMo qua POST
        await apiClient.post("/deposits/webhook/momo", params);
        setStatus(momoResultCode === "0" ? "success" : "failed");

      } else {
        setStatus("failed");
      }
    } catch {
      // Kể cả lỗi mạng vẫn hiển thị kết quả dựa vào param
      const isVnpayOk = vnpResponseCode === "00";
      const isMomoOk = momoResultCode === "0";
      setStatus(isVnpayOk || isMomoOk ? "success" : "failed");
    }
  }, [searchParams, vnpResponseCode, momoResultCode]);

  // Tính txnRef & amount chung cho cả 2 cổng
  const txnRef = vnpTxnRef ?? momoOrderId ?? null;
  const amount = gateway === "MOMO" ? momoAmount : vnpAmount;
  const isPromote = txnRef?.startsWith("PROMOTE_");
  const isSubscription = txnRef?.startsWith("SUB_");
  const bankInfo = gateway === "VNPAY" ? (vnpBankCode || "VNPay") : (momoTransId ? `MoMo #${momoTransId}` : "MoMo Wallet");
  const redirectTarget = isSubscription 
    ? "/app/landlord/subscription" 
    : (isPromote ? "/app/landlord/my-listings" : "/app/deposits");

  useEffect(() => {
    const timer = setTimeout(() => {
      triggerWebhook();
    }, 0);
    return () => clearTimeout(timer);
  }, [triggerWebhook]);

  // ── Auto-redirect countdown sau khi có kết quả ──
  useEffect(() => {
    if (status === "loading") return;
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  // Thực hiện redirect khi đếm ngược về 0
  useEffect(() => {
    if (countdown === 0 && status !== "loading") {
      window.location.href = redirectTarget;
    }
  }, [countdown, status, redirectTarget]);

  // ── Loading ──
  if (status === "loading") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100 py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 text-center space-y-5 border border-gray-100">
          <div className="relative flex justify-center">
            <div className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-blue-50 animate-ping opacity-70" />
            <div className="relative p-4 bg-blue-50 rounded-full text-blue-500">
              <ShieldCheck className="h-8 w-8" />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-gray-800">Đang xác nhận giao dịch...</h2>
            <p className="text-xs text-gray-400">Vui lòng không đóng trình duyệt.</p>
          </div>
          <Loader2 className="h-6 w-6 text-blue-500 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // ── Success ──
  if (status === "success") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100 py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-emerald-100 overflow-hidden">

          {/* Header banner */}
          <div className={`px-6 py-8 text-center text-white relative overflow-hidden
            ${isSubscription
              ? "bg-gradient-to-br from-indigo-500 to-purple-600"
              : isPromote
                ? "bg-gradient-to-br from-amber-500 to-orange-600"
                : gateway === "MOMO"
                  ? "bg-gradient-to-br from-pink-500 to-rose-600"
                  : "bg-gradient-to-br from-emerald-500 to-teal-600"
            }`}>
            <div className="absolute -right-6 -top-6 opacity-10">
              {isSubscription || isPromote ? <Sparkles size={130} /> : <ShieldCheck size={130} />}
            </div>
            <div className="inline-flex p-3 bg-white/25 backdrop-blur-md rounded-full mb-3 text-white ring-2 ring-white/30">
              {isSubscription || isPromote
                ? <Sparkles className="h-10 w-10 fill-amber-300" />
                : <CheckCircle className="h-10 w-10 fill-white/30" />}
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              {isSubscription ? "Đăng Ký Hội Viên Thành Công!" : (isPromote ? "Đẩy Tin Thành Công!" : "Thanh Toán Thành Công!")}
            </h1>
            <p className="text-white/85 text-xs mt-1 font-medium">
              {gateway === "MOMO" ? "Giao dịch xác nhận qua Ví MoMo" : "Giao dịch được ký xác thực bởi VNPay"}
            </p>
          </div>

          <div className="p-7 space-y-5">
            {/* Details */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 divide-y divide-dashed divide-gray-200 text-sm">
              <div className="flex justify-between py-2.5 text-gray-500">
                <span>Mã giao dịch:</span>
                <span className="font-bold text-gray-800">#{txnRef || "N/A"}</span>
              </div>
              <div className="flex justify-between py-2.5 text-gray-500">
                <span>Phương thức:</span>
                <span className="font-semibold text-gray-800">{bankInfo}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="font-medium text-gray-700">Số tiền:</span>
                <span className={`text-lg font-extrabold ${
                  isSubscription ? "text-indigo-600" : isPromote ? "text-amber-600" : gateway === "MOMO" ? "text-pink-600" : "text-emerald-600"
                }`}>{formatPrice(amount)}</span>
              </div>
            </div>

            {/* Note box */}
            {isSubscription ? (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-3">
                <Sparkles className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-800 leading-relaxed">
                  <strong>Kích hoạt gói Seller Pro thành công!</strong> Các đặc quyền giới hạn tin đăng mới và tăng tốc hiển thị của bạn đã sẵn sàng sử dụng.
                </p>
              </div>
            ) : isPromote ? (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
                <Sparkles className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>Ưu tiên hiển thị đã kích hoạt!</strong> Tin đăng của bạn đang được đưa lên vị trí hàng đầu.
                </p>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex gap-3">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-800 leading-relaxed">
                  <strong>Escrow đang bảo vệ bạn.</strong> Tiền cọc được giữ an toàn. Chủ nhà chỉ nhận tiền sau khi bạn xác nhận dọn vào phòng.
                </p>
              </div>
            )}

            {/* Auto redirect countdown */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <Clock className="h-3.5 w-3.5" />
              {countdown > 0
                ? <span>Tự chuyển trang sau <strong>{countdown}s</strong>...</span>
                : <span>Đang chuyển trang...</span>
              }
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2.5">
              <Link
                href={redirectTarget}
                className={`w-full flex items-center justify-center gap-2 text-white py-3 rounded-xl font-bold transition-all shadow-lg
                  ${isSubscription
                    ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
                    : isPromote
                      ? "bg-amber-500 hover:bg-amber-600 shadow-amber-100"
                      : gateway === "MOMO"
                        ? "bg-pink-500 hover:bg-pink-600 shadow-pink-100"
                        : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100"
                  }`}
              >
                <span>{isSubscription ? "Xem gói hội viên của tôi" : (isPromote ? "Quản lý tin đăng" : "Xem lịch sử đặt cọc")}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/app" className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
                <Home className="h-4 w-4" />
                <span>Về trang chủ</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Failed ──
  const responseCodeDisplay = vnpResponseCode ?? momoResultCode ?? "Lỗi không xác định";
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-red-50 overflow-hidden">
        <div className="bg-gradient-to-br from-red-500 to-rose-600 px-6 py-8 text-center text-white relative overflow-hidden">
          <div className="absolute -right-6 -top-6 opacity-10">
            <XCircle size={130} />
          </div>
          <div className="inline-flex p-3 bg-white/20 backdrop-blur-md rounded-full mb-3 ring-2 ring-white/20">
            <XCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Thanh Toán Thất Bại</h1>
          <p className="text-red-100 text-xs mt-1 font-medium">Giao dịch không thành công hoặc đã bị hủy</p>
        </div>

        <div className="p-7 space-y-5">
          <div className="bg-red-50/70 border border-red-100 rounded-2xl p-5 text-center space-y-2">
            <p className="text-sm text-red-700 font-semibold">
              Mã lỗi: {responseCodeDisplay}
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Thanh toán bị từ chối hoặc bạn đã hủy giao dịch.
              Nếu tài khoản đã bị trừ tiền nhưng giao dịch thất bại, vui lòng liên hệ hỗ trợ.
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            {txnRef && !isPromote && (
              <Link
                href={`/app/checkout/${txnRef}`}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
              >
                <CreditCard className="h-4 w-4" />
                <span>Thử lại với phương thức khác</span>
              </Link>
            )}
            <Link href="/app" className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
              <Home className="h-4 w-4" />
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
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 border-b-2 text-emerald-600 animate-spin mx-auto" />
            <p className="text-sm text-gray-500 font-semibold">Đang tải kết quả...</p>
          </div>
        </div>
      }
    >
      <PaymentResultInner />
    </Suspense>
  );
}
