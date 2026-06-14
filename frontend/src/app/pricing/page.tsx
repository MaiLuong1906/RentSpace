"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Sparkles, ArrowRight, ShieldCheck, Zap, Image as ImageIcon, BarChart3 } from "lucide-react";

export default function PricingPage() {
  const router = useRouter();
  const plans = [
    {
      id: 1,
      name: "FREE",
      displayName: "Miễn phí (FREE)",
      price: 0,
      period: "",
      description: "Dành cho chủ nhà cá nhân bắt đầu đăng tin phòng trọ.",
      features: [
        "Đăng tối đa 10 tin hiển thị",
        "Đính kèm 5 ảnh mỗi tin",
        "Tặng 0 credit đẩy tin",
        "Phân tích hiệu quả tin đăng: Cơ bản",
        "Hỗ trợ qua cộng đồng"
      ],
      icon: <ShieldCheck className="h-6 w-6 text-slate-500" />,
      highlight: false
    },
    {
      id: 2,
      name: "SELLER_PRO_MONTHLY",
      displayName: "Seller Pro (Tháng)",
      price: 99000,
      period: "/tháng",
      description: "Giải pháp hiệu quả cho môi giới và chủ nhà chuyên nghiệp.",
      features: [
        "Đăng tối đa 50 tin hiển thị",
        "Đính kèm 15 ảnh mỗi tin",
        "Tặng 2 credit đẩy tin nổi bật/tháng",
        "Phân tích hiệu quả tin đăng: Nâng cao",
        "Hỗ trợ ưu tiên 24/7"
      ],
      icon: <Zap className="h-6 w-6 text-indigo-500" />,
      highlight: false
    },
    {
      id: 3,
      name: "SELLER_PRO_YEARLY",
      displayName: "Seller Pro (Năm)",
      price: 799000,
      period: "/năm",
      description: "Đặc quyền tối đa, tiết kiệm chi phí lâu dài cho doanh nghiệp.",
      features: [
        "Đăng tối đa 50 tin hiển thị",
        "Đính kèm 15 ảnh mỗi tin",
        "Tặng 25 credit đẩy tin nổi bật/năm",
        "Phân tích hiệu quả tin đăng: Nâng cao",
        "Hỗ trợ ưu tiên 24/7",
        "Hỗ trợ thiết kế tin đăng nổi bật"
      ],
      icon: <Sparkles className="h-6 w-6 text-amber-500" />,
      highlight: true
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar đơn giản */}
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-extrabold text-indigo-600 tracking-tight">
            RentSpace
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm font-semibold text-slate-650 hover:text-slate-900 transition-colors">
              Đăng nhập
            </Link>
            <Link 
              href="/auth/register" 
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Đăng ký chủ nhà
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <section className="py-20 text-center relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(99,102,241,0.02),transparent)]" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 relative z-10">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 uppercase tracking-wider">
            Gói cước RentSpace
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-950 tracking-tight">
            Gói Hội Viên & Giá Dịch Vụ
          </h1>
          <p className="text-slate-550 text-lg md:text-xl max-w-2xl mx-auto">
            Nâng tầm hiệu quả cho thuê phòng trọ của bạn với các đặc quyền hiển thị và đẩy tin thông minh từ RentSpace.
          </p>
        </div>
      </section>

      {/* Pricing Matrix */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => {
            const isFree = plan.name === "FREE";
            return (
              <div 
                key={plan.id}
                onClick={() => router.push("/auth/register?role=LANDLORD")}
                className={`flex flex-col rounded-3xl bg-white border transition-all duration-300 relative overflow-hidden cursor-pointer ${
                  isFree
                    ? "border-slate-200 hover:border-slate-350 hover:shadow-md active:scale-[0.99]"
                    : plan.highlight 
                      ? "border-indigo-600 ring-4 ring-indigo-650/5 shadow-xl md:-translate-y-2 hover:md:-translate-y-3.5 hover:shadow-2xl hover:border-indigo-500 active:scale-[0.97]" 
                      : "border-slate-200 hover:border-indigo-400 hover:shadow-xl hover:-translate-y-1.5 active:scale-[0.97]"
                }`}
              >
              {/* Ribbon nổi bật */}
              {plan.highlight && (
                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-extrabold px-6 py-1.5 rotate-45 translate-x-5 translate-y-3 uppercase tracking-wider">
                  Bán chạy nhất
                </div>
              )}

              {/* Card Header */}
              <div className="p-8 border-b border-slate-100 space-y-5">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${plan.highlight ? "bg-indigo-50" : "bg-slate-50"}`}>
                    {plan.icon}
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-lg">{plan.displayName}</h3>
                </div>
                
                <p className="text-slate-500 text-sm">{plan.description}</p>
                
                <div className="flex items-baseline pt-2">
                  <span className="text-4xl font-black text-slate-950">
                    {plan.price === 0 ? "Miễn phí" : plan.price.toLocaleString("vi-VN") + "₫"}
                  </span>
                  <span className="text-slate-450 text-sm ml-1 font-medium">{plan.period}</span>
                </div>
              </div>

              {/* Card Features & CTA */}
              <div className="p-8 flex-1 flex flex-col justify-between space-y-8">
                <ul className="space-y-4 text-sm text-slate-600">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <Check className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div>
                  <Link 
                    href="/auth/register?role=LANDLORD" 
                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-200 shadow-sm ${
                      plan.highlight
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                    }`}
                  >
                    Bắt đầu ngay
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          )})}
        </div>
      </section>

      {/* Feature matrix / Details */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-200">
        <h2 className="text-2xl font-bold text-center text-slate-900 mb-10">Bảng So Sánh Chi Tiết Quyền Lợi</h2>
        
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-5 font-bold text-slate-700">Đặc quyền tính năng</th>
                <th className="p-5 font-bold text-slate-700 text-center">Gói Free</th>
                <th className="p-5 font-bold text-slate-700 text-center">Seller Pro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-5 font-medium text-slate-650 flex items-center gap-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-slate-400" /> Tin đăng hiển thị tối đa
                </td>
                <td className="p-5 text-center text-slate-700 font-semibold">10 tin</td>
                <td className="p-5 text-center text-slate-700 font-bold text-indigo-650">50 tin</td>
              </tr>
              <tr>
                <td className="p-5 font-medium text-slate-650 flex items-center gap-2">
                  <ImageIcon className="h-4.5 w-4.5 text-slate-400" /> Ảnh đính kèm mỗi tin
                </td>
                <td className="p-5 text-center text-slate-700">5 ảnh</td>
                <td className="p-5 text-center text-slate-700 font-semibold">15 ảnh</td>
              </tr>
              <tr>
                <td className="p-5 font-medium text-slate-650 flex items-center gap-2">
                  <Zap className="h-4.5 w-4.5 text-slate-400" /> Tín dụng đẩy tin (Boost)
                </td>
                <td className="p-5 text-center text-slate-500">—</td>
                <td className="p-5 text-center text-slate-700 font-semibold">2 / tháng (hoặc 25 / năm)</td>
              </tr>
              <tr>
                <td className="p-5 font-medium text-slate-650 flex items-center gap-2">
                  <BarChart3 className="h-4.5 w-4.5 text-slate-400" /> Báo cáo & phân tích tin đăng
                </td>
                <td className="p-5 text-center text-slate-700">Cơ bản</td>
                <td className="p-5 text-center text-slate-700 font-semibold">Nâng cao (Thời gian thực)</td>
              </tr>
              <tr>
                <td className="p-5 font-medium text-slate-650 flex items-center gap-2">
                  <Check className="h-4.5 w-4.5 text-indigo-500" /> Huy hiệu xác thực Pro
                </td>
                <td className="p-5 text-center text-slate-500">—</td>
                <td className="p-5 text-center text-slate-700 text-indigo-650 font-bold">Có</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 text-center text-slate-450 text-xs font-medium">
        © 2026 RentSpace. Bảo lưu mọi quyền.
      </footer>
    </div>
  );
}
