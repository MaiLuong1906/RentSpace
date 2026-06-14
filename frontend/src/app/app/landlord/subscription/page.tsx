"use client";

import { useEffect, useState } from "react";
import { 
  getCurrentSubscription, 
  getSubscriptionPlans, 
  subscribePlan 
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
  BarChart3 
} from "lucide-react";
import { toast } from "sonner";

export default function SubscriptionDashboard() {
  const [loading, setLoading] = useState(true);
  const [currentSubData, setCurrentSubData] = useState<UserSubscriptionResponse | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  
  // Payment state
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
          getSubscriptionPlans()
        ]);
        if (isMounted) {
          setCurrentSubData(subResponse);
          setPlans(plansResponse);
        }
      } catch (error) {
        console.error("Error loading subscription data:", error);
        toast.error("Không thể tải thông tin gói cước. Vui lòng thử lại sau.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    
    try {
      setPaymentLoading(true);
      const response = await subscribePlan(selectedPlan.id, paymentGateway);
      if (response && response.paymentUrl) {
        toast.success("Đang chuyển hướng tới cổng thanh toán...");
        window.location.href = response.paymentUrl;
      } else {
        toast.success("Gói cước đã được kích hoạt thành công!");
        setSelectedPlan(null);
        // Reload page to refresh state
        window.location.reload();
      }
    } catch (error: unknown) {
      console.error("Payment registration error:", error);
      const errResponse = error as { response?: { data?: { message?: string } } };
      const errMsg = errResponse.response?.data?.message || "Không thể khởi tạo thanh toán gói cước.";
      toast.error(errMsg);
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50/50 py-12">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Đang tải thông tin cước phí...</p>
      </div>
    );
  }

  const subscription = currentSubData?.subscription;
  const activeListingCount = currentSubData?.activeListingCount || 0;
  const maxListings = subscription?.plan.maxListings || 10;
  const usagePercentage = Math.min((activeListingCount / maxListings) * 100, 100);
  const isLimitReached = activeListingCount >= maxListings;

  return (
    <div className="min-h-screen bg-slate-50/50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Gói Hội Viên & Hạn Mức</h1>
            <p className="text-slate-500 mt-2">Nâng cấp hội viên giúp tăng số lượng tin đăng, đẩy tin nổi bật và tiếp cận nhiều người thuê hơn.</p>
          </div>
        </div>

        {/* Current Plan Details */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 overflow-hidden border-slate-100 shadow-sm relative bg-white/80 backdrop-blur-md">
            <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-500 to-purple-600" />
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-slate-800">Gói hiện tại</CardTitle>
                  <CardDescription className="text-xs mt-1">Thông tin chi tiết về gói cước đang sử dụng</CardDescription>
                </div>
                <Badge className={`text-xs px-3 py-1 font-bold ${
                  subscription?.plan.name === "FREE"
                    ? "bg-slate-100 text-slate-800 border border-slate-200"
                    : "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm"
                }`}>
                  {subscription?.plan.displayName || "Miễn phí (FREE)"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-slate-400" /> Hạn mức tin đăng Active:
                  </span>
                  <span className={`font-bold ${isLimitReached ? "text-rose-600" : "text-indigo-600"}`}>
                    {activeListingCount} / {maxListings} tin
                  </span>
                </div>
                <Progress 
                  value={usagePercentage} 
                  className={`h-2.5 rounded-full ${
                    isLimitReached ? "[&>div]:bg-rose-500" : "[&>div]:bg-indigo-500"
                  }`} 
                />
                {isLimitReached && (
                  <p className="text-xs text-rose-500 font-medium flex items-center gap-1 mt-1">
                    <AlertTriangle className="h-3.5 w-3.5" /> Bạn đã dùng hết hạn mức đăng tin của gói hiện tại. Hãy nâng cấp gói cước để tiếp tục đăng tin.
                  </p>
                )}
              </div>

              {/* Status details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-sm">
                <div>
                  <div className="text-slate-400 text-xs">Trạng thái gói</div>
                  <div className="font-semibold text-slate-800 mt-1 flex items-center gap-1">
                    {subscription?.status === "ACTIVE" ? (
                      <>
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Đang hoạt động
                      </>
                    ) : (
                      <>
                        <span className="h-2 w-2 rounded-full bg-slate-400" />
                        Không hoạt động (FREE)
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 text-xs">Ngày đăng ký</div>
                  <div className="font-semibold text-slate-800 mt-1">
                    {subscription?.startedAt 
                      ? new Date(subscription.startedAt).toLocaleDateString("vi-VN") 
                      : "Mặc định"}
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 text-xs">Ngày hết hạn</div>
                  <div className="font-semibold text-slate-800 mt-1">
                    {subscription?.expiresAt 
                      ? new Date(subscription.expiresAt).toLocaleDateString("vi-VN") 
                      : "Không giới hạn"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Perks */}
          <Card className="border-slate-100 shadow-sm bg-white/80 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-800">Quyền lợi hiện tại</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-500 rounded-lg">
                  <ImageIcon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Ảnh tối đa mỗi tin</div>
                  <div className="font-semibold text-slate-800">{subscription?.plan.maxImages || 5} ảnh</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-500 rounded-lg">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Boost credit mỗi tháng</div>
                  <div className="font-semibold text-slate-800">{subscription?.plan.boostCredits || 0} tín dụng đẩy tin</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-500 rounded-lg">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Phân tích tin đăng</div>
                  <div className="font-semibold text-slate-800">
                    {subscription?.plan.analyticsLevel === "ADVANCED" ? "Nâng cao" : "Cơ bản"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Matrix */}
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl font-bold text-slate-800">Chọn Gói Hội Viên Phù Hợp</h2>
            <p className="text-slate-500 text-sm">Gia tăng doanh số cho thuê bằng các đặc quyền ưu tiên vượt trội.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            {plans.map((plan) => {
              const isCurrent = subscription?.plan.id === plan.id || (!subscription && plan.name === "FREE");
              const isPro = plan.name !== "FREE";
              
              return (
                <div 
                  key={plan.id}
                  onClick={() => !isCurrent && isPro && setSelectedPlan(plan)}
                  className={`flex flex-col rounded-2xl bg-white border transition-all duration-300 relative ${
                    isCurrent 
                      ? isPro
                        ? "border-indigo-600 ring-2 ring-indigo-600/10 shadow-lg cursor-default" 
                        : "border-slate-250 bg-slate-50/50 shadow-sm cursor-default"
                      : isPro
                        ? "border-slate-150 hover:border-indigo-500 hover:shadow-xl hover:-translate-y-1.5 active:scale-[0.97] cursor-pointer"
                        : "border-slate-100 opacity-60 cursor-not-allowed"
                  }`}
                >
                  {/* Recommended badge */}
                  {plan.name === "SELLER_PRO_YEARLY" && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                      <Sparkles size={10} /> Tiết kiệm 15%
                    </div>
                  )}

                  {/* Plan header */}
                  <div className="p-6 border-b border-slate-100 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">{plan.displayName}</h3>
                        <p className="text-slate-400 text-xs mt-1">
                          {plan.name === "FREE" ? "Dành cho chủ trọ cá nhân nhỏ" : "Dành cho môi giới chuyên nghiệp"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-baseline">
                      <span className="text-3xl font-extrabold text-slate-950">
                        {plan.price === 0 ? "Miễn phí" : plan.price.toLocaleString("vi-VN") + "₫"}
                      </span>
                      {isPro && (
                        <span className="text-slate-400 text-sm ml-1">
                          /{plan.name === "SELLER_PRO_YEARLY" ? "năm" : "tháng"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Plan details */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                    <ul className="space-y-3.5 text-sm text-slate-600">
                      <li className="flex items-center gap-2.5">
                        <Check className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                        <span>Đăng tối đa <strong>{plan.maxListings}</strong> tin hiển thị</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <Check className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                        <span>Đính kèm <strong>{plan.maxImages}</strong> ảnh mỗi tin</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <Check className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                        <span>Tặng <strong>{plan.boostCredits}</strong> credit đẩy tin nổi bật</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <Check className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                        <span>Phân tích hiệu quả tin đăng: <strong>{plan.analyticsLevel === "ADVANCED" ? "Nâng cao" : "Cơ bản"}</strong></span>
                      </li>
                    </ul>

                    <div>
                      {isCurrent ? (
                        <Button className="w-full bg-slate-100 hover:bg-slate-100 text-slate-700 font-semibold cursor-default" disabled>
                          Gói hiện tại
                        </Button>
                      ) : isPro ? (
                        <Button 
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all duration-200"
                          onClick={() => setSelectedPlan(plan)}
                        >
                          Nâng cấp ngay
                        </Button>
                      ) : (
                        <Button className="w-full bg-slate-100 hover:bg-slate-100 text-slate-700 font-semibold" disabled>
                          Không khả dụng
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Payment Gateway Select Modal */}
      <Dialog open={!!selectedPlan} onOpenChange={(open) => !open && setSelectedPlan(null)}>
        <DialogContent className="sm:max-w-[420px] rounded-3xl overflow-hidden border border-slate-100 bg-white shadow-2xl p-0">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 px-6 py-6 text-white text-center relative overflow-hidden">
            <div className="absolute -right-6 -top-6 opacity-10">
              <Sparkles size={120} />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight">Xác nhận Đăng Ký Hội Viên</DialogTitle>
            <DialogDescription className="text-indigo-100/90 text-xs mt-1">
              Bạn đang thực hiện nâng cấp lên gói <strong className="text-white">{selectedPlan?.displayName}</strong>
            </DialogDescription>
          </div>

          <div className="p-6 space-y-6">
            {/* Bill summary */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 divide-y divide-dashed divide-slate-200 text-sm space-y-3">
              <div className="flex justify-between font-medium text-slate-500">
                <span>Gói lựa chọn:</span>
                <span className="text-slate-800 font-bold">{selectedPlan?.displayName}</span>
              </div>
              <div className="flex justify-between pt-3 font-semibold text-slate-800">
                <span>Tổng chi phí:</span>
                <span className="text-indigo-600 text-base font-extrabold">
                  {selectedPlan?.price.toLocaleString("vi-VN")}₫
                </span>
              </div>
            </div>

            {/* Payment methods */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Chọn phương thức thanh toán:
              </label>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentGateway("VNPAY")}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-1.5 ${
                    paymentGateway === "VNPAY"
                      ? "border-blue-500 bg-blue-50/20 text-blue-700 shadow-sm"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <CreditCard className="h-6 w-6 text-blue-500" />
                  <span className="font-bold text-xs">Cổng VNPay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentGateway("MOMO")}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-1.5 ${
                    paymentGateway === "MOMO"
                      ? "border-pink-500 bg-pink-50/20 text-pink-700 shadow-sm"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <Zap className="h-6 w-6 text-pink-500" />
                  <span className="font-bold text-xs">Ví MoMo</span>
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setSelectedPlan(null)}
                className="flex-1 py-5 rounded-xl border-slate-200 hover:bg-slate-50 font-semibold"
                disabled={paymentLoading}
              >
                Hủy bỏ
              </Button>
              <Button
                onClick={handleSubscribe}
                disabled={paymentLoading}
                className="flex-1 py-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-500/10"
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
