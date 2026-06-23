"use client";

import { useEffect, useState } from "react";
import {
  getCurrentSubscription,
  getSubscriptionPlans,
  subscribePlan,
} from "@/lib/api/subscription.api";
import { SubscriptionPlan, UserSubscriptionResponse } from "@/types/subscription.types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  Sparkles,
  Check,
  AlertTriangle,
  CreditCard,
  Loader2,
  Zap,
  FileText,
  Image as ImageIcon,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";

export default function SubscriptionDashboard() {
  const [loading, setLoading] = useState(true);
  const [currentSubData, setCurrentSubData] = useState<UserSubscriptionResponse | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [paymentGateway, setPaymentGateway] = useState<"VNPAY" | "MOMO">("VNPAY");
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [subResponse, plansResponse] = await Promise.all([
          getCurrentSubscription(),
          getSubscriptionPlans(),
        ]);
        if (isMounted) {
          setCurrentSubData(subResponse);
          setPlans(plansResponse);
        }
      } catch (error) {
        console.error("Error loading subscription data:", error);
        toast.error("Không thể tải thông tin gói cước. Vui lòng thử lại sau.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, []);

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    try {
      setPaymentLoading(true);
      const response = await subscribePlan(selectedPlan.id, paymentGateway);
      if (response?.paymentUrl) {
        toast.success("Đang chuyển hướng tới cổng thanh toán...");
        window.location.href = response.paymentUrl;
      } else {
        toast.success("Gói cước đã được kích hoạt thành công!");
        setSelectedPlan(null);
        window.location.reload();
      }
    } catch (error: unknown) {
      console.error("Payment registration error:", error);
      const errResponse = error as { response?: { data?: { message?: string } } };
      toast.error(errResponse.response?.data?.message || "Không thể khởi tạo thanh toán gói cước.");
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#FAFAFA] py-12">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-3" />
        <p className="text-gray-500 text-sm">Đang tải thông tin cước phí...</p>
      </div>
    );
  }

  const subscription = currentSubData?.subscription;
  const activeListingCount = currentSubData?.activeListingCount || 0;
  const maxListings = subscription?.plan.maxListings || 10;
  const usagePercentage = Math.min((activeListingCount / maxListings) * 100, 100);
  const isLimitReached = activeListingCount >= maxListings;

  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* ── Header ── */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Gói Hội Viên &amp; Hạn Mức
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Nâng cấp hội viên giúp tăng số lượng tin đăng, đẩy tin nổi bật và tiếp cận nhiều người thuê hơn.
          </p>
        </div>

        {/* ── Current Plan ── */}
        <div className="grid md:grid-cols-3 gap-5">
          <Card className="md:col-span-2 overflow-hidden border-gray-200 shadow-none bg-white relative">
            {/* Blue left accent bar */}
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600 rounded-l-lg" />
            <CardHeader className="pb-4 pl-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-gray-900">Gói hiện tại</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Thông tin chi tiết về gói cước đang sử dụng
                  </CardDescription>
                </div>
                <Badge
                  className={`text-xs px-3 py-1 font-semibold ${
                    subscription?.plan.name === "FREE"
                      ? "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-100"
                      : "bg-amber-500 text-white hover:bg-amber-500"
                  }`}
                >
                  {subscription?.plan.displayName || "Miễn phí (FREE)"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pl-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-600 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-gray-400" />
                    Hạn mức tin đăng Active:
                  </span>
                  <span className={`font-semibold ${isLimitReached ? "text-red-600" : "text-blue-600"}`}>
                    {activeListingCount} / {maxListings} tin
                  </span>
                </div>
                <Progress
                  value={usagePercentage}
                  className={`h-2 rounded-full ${
                    isLimitReached ? "[&>div]:bg-red-500" : "[&>div]:bg-blue-600"
                  }`}
                />
                {isLimitReached && (
                  <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Bạn đã dùng hết hạn mức đăng tin của gói hiện tại. Hãy nâng cấp gói cước để tiếp tục đăng tin.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100 text-sm">
                <div>
                  <div className="text-gray-400 text-xs">Trạng thái gói</div>
                  <div className="font-medium text-gray-800 mt-1 flex items-center gap-1.5">
                    {subscription?.status === "ACTIVE" ? (
                      <>
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Đang hoạt động
                      </>
                    ) : (
                      <>
                        <span className="h-2 w-2 rounded-full bg-gray-400" />
                        Không hoạt động (FREE)
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">Ngày đăng ký</div>
                  <div className="font-medium text-gray-800 mt-1">
                    {subscription?.startedAt
                      ? new Date(subscription.startedAt).toLocaleDateString("vi-VN")
                      : "Mặc định"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">Ngày hết hạn</div>
                  <div className="font-medium text-gray-800 mt-1">
                    {subscription?.expiresAt
                      ? new Date(subscription.expiresAt).toLocaleDateString("vi-VN")
                      : "Không giới hạn"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Perks */}
          <Card className="border-gray-200 shadow-none bg-white">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-gray-900">Quyền lợi hiện tại</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {[
                {
                  icon: <ImageIcon className="h-4 w-4 text-blue-600" />,
                  label: "Ảnh tối đa mỗi tin",
                  value: `${subscription?.plan.maxImages || 5} ảnh`,
                },
                {
                  icon: <Zap className="h-4 w-4 text-blue-600" />,
                  label: "Boost credit mỗi tháng",
                  value: `${subscription?.plan.boostCredits || 0} tín dụng đẩy tin`,
                },
                {
                  icon: <BarChart3 className="h-4 w-4 text-blue-600" />,
                  label: "Phân tích tin đăng",
                  value: subscription?.plan.analyticsLevel === "ADVANCED" ? "Nâng cao" : "Cơ bản",
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg shrink-0">{item.icon}</div>
                  <div>
                    <div className="text-xs text-gray-400">{item.label}</div>
                    <div className="font-medium text-gray-800">{item.value}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* ── Pricing Matrix ── */}
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xl font-bold tracking-tight text-gray-900">Chọn Gói Hội Viên Phù Hợp</h2>
            <p className="text-sm text-gray-500 mt-1">
              Gia tăng doanh số cho thuê bằng các đặc quyền ưu tiên vượt trội.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {plans.map((plan) => {
              const isCurrent =
                subscription?.plan.id === plan.id || (!subscription && plan.name === "FREE");
              const isPro = plan.name !== "FREE";
              const isYearly = plan.name === "SELLER_PRO_YEARLY";

              return (
                <div
                  key={plan.id}
                  onClick={() => !isCurrent && isPro && setSelectedPlan(plan)}
                  className={`flex flex-col rounded-2xl bg-white border transition-all duration-200 relative ${
                    isCurrent
                      ? isPro
                        ? "border-blue-600 ring-2 ring-blue-600/10 cursor-default"
                        : "border-gray-200 bg-gray-50/50 cursor-default"
                      : isPro
                      ? "border-gray-200 hover:border-blue-400 hover:shadow-[0_4px_16px_rgba(37,99,235,0.1)] hover:-translate-y-1 cursor-pointer"
                      : "border-gray-200 opacity-60 cursor-not-allowed"
                  }`}
                >
                  {isYearly && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="flex items-center gap-1 bg-amber-500 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                        <Sparkles className="h-3 w-3" /> Tiết kiệm 33%
                      </span>
                    </div>
                  )}

                  <div className="p-6 border-b border-gray-100 space-y-3">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-gray-900 text-base">{plan.displayName}</h3>
                      {isPro && (
                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {isYearly ? "Năm" : "Tháng"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {plan.name === "FREE"
                        ? "Dành cho chủ trọ cá nhân nhỏ"
                        : "Dành cho môi giới chuyên nghiệp"}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-gray-900">
                        {plan.price === 0
                          ? "Miễn phí"
                          : plan.price.toLocaleString("vi-VN") + "đ"}
                      </span>
                      {isPro && (
                        <span className="text-sm text-gray-400">
                          /{isYearly ? "năm" : "tháng"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between gap-5">
                    <ul className="space-y-3 text-sm text-gray-600">
                      {[
                        `Đăng tối đa ${plan.maxListings} tin hiển thị`,
                        `Đính kèm ${plan.maxImages} ảnh mỗi tin`,
                        `Tặng ${plan.boostCredits} credit đẩy tin nổi bật`,
                        `Phân tích hiệu quả: ${plan.analyticsLevel === "ADVANCED" ? "Nâng cao" : "Cơ bản"}`,
                      ].map((feat) => (
                        <li key={feat} className="flex items-start gap-2.5">
                          <Check className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                          <span dangerouslySetInnerHTML={{ __html: feat.replace(/(\d+)/g, "<strong>$1</strong>") }} />
                        </li>
                      ))}
                    </ul>

                    {isCurrent ? (
                      <Button className="w-full bg-gray-100 hover:bg-gray-100 text-gray-600 font-medium cursor-default" disabled>
                        Gói hiện tại
                      </Button>
                    ) : isPro ? (
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
                        onClick={() => setSelectedPlan(plan)}
                      >
                        Nâng cấp ngay
                      </Button>
                    ) : (
                      <Button className="w-full bg-gray-100 hover:bg-gray-100 text-gray-500 font-medium" disabled>
                        Không khả dụng
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Payment Dialog ── */}
      <Dialog open={!!selectedPlan} onOpenChange={(open) => !open && setSelectedPlan(null)}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.08)] p-0">
          <div className="bg-blue-600 px-6 py-5 text-white text-center">
            <DialogTitle className="text-lg font-bold tracking-tight">
              Xác nhận Đăng Ký Hội Viên
            </DialogTitle>
            <DialogDescription className="text-blue-100 text-xs mt-1">
              Bạn đang nâng cấp lên gói{" "}
              <strong className="text-white">{selectedPlan?.displayName}</strong>
            </DialogDescription>
          </div>

          <div className="p-6 space-y-5">
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm space-y-3 divide-y divide-dashed divide-gray-200">
              <div className="flex justify-between text-gray-500">
                <span>Gói lựa chọn:</span>
                <span className="text-gray-800 font-semibold">{selectedPlan?.displayName}</span>
              </div>
              <div className="flex justify-between pt-3">
                <span className="font-medium text-gray-700">Tổng chi phí:</span>
                <span className="text-blue-600 font-bold">
                  {selectedPlan?.price.toLocaleString("vi-VN")}đ
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-500">
                Chọn phương thức thanh toán
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentGateway("VNPAY")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-1.5 ${
                    paymentGateway === "VNPAY"
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  <CreditCard className="h-5 w-5" />
                  <span className="font-semibold text-xs">Cổng VNPay</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentGateway("MOMO")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-1.5 ${
                    paymentGateway === "MOMO"
                      ? "border-pink-500 bg-pink-50 text-pink-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  <Zap className="h-5 w-5" />
                  <span className="font-semibold text-xs">Ví MoMo</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setSelectedPlan(null)}
                className="flex-1 rounded-xl border-gray-200 font-medium"
                disabled={paymentLoading}
              >
                Hủy bỏ
              </Button>
              <Button
                onClick={handleSubscribe}
                disabled={paymentLoading}
                className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                {paymentLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Đang xử lý...
                  </>
                ) : (
                  "Thanh toán ngay"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
