"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Image as ImageIcon,
  BarChart3,
  Home,
  X,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const PLANS = [
  {
    id: 1,
    name: "FREE",
    displayName: "Miễn phí",
    badge: null,
    price: 0,
    priceLabel: "Miễn phí",
    period: "",
    description: "Dành cho chủ nhà cá nhân bắt đầu đăng tin phòng trọ.",
    features: [
      { text: "Đăng tối đa 10 tin hiển thị", included: true },
      { text: "Đính kèm 5 ảnh mỗi tin", included: true },
      { text: "Phân tích tin đăng: Cơ bản", included: true },
      { text: "Hỗ trợ qua cộng đồng", included: true },
      { text: "Credit đẩy tin nổi bật", included: false },
      { text: "Hỗ trợ ưu tiên 24/7", included: false },
    ],
    highlight: false,
    ctaText: "Bắt đầu miễn phí",
    ctaHref: "/auth/register?role=LANDLORD",
  },
  {
    id: 2,
    name: "SELLER_PRO_MONTHLY",
    displayName: "Seller Pro",
    badge: "Tháng",
    price: 99000,
    priceLabel: (99000).toLocaleString("vi-VN") + "đ",
    period: "/tháng",
    description: "Giải pháp hiệu quả cho môi giới và chủ nhà chuyên nghiệp.",
    features: [
      { text: "Đăng tối đa 50 tin hiển thị", included: true },
      { text: "Đính kèm 15 ảnh mỗi tin", included: true },
      { text: "Phân tích tin đăng: Nâng cao", included: true },
      { text: "Hỗ trợ ưu tiên 24/7", included: true },
      { text: "2 credit đẩy tin/tháng", included: true },
      { text: "Huy hiệu xác thực Pro", included: true },
    ],
    highlight: false,
    ctaText: "Đăng ký ngay",
    ctaHref: "/auth/register?role=LANDLORD",
  },
  {
    id: 3,
    name: "SELLER_PRO_YEARLY",
    displayName: "Seller Pro",
    badge: "Năm",
    price: 799000,
    priceLabel: (799000).toLocaleString("vi-VN") + "đ",
    period: "/năm",
    savingBadge: "Tiết kiệm 33%",
    description: "Đặc quyền tối đa, tiết kiệm chi phí lâu dài cho doanh nghiệp.",
    features: [
      { text: "Đăng tối đa 50 tin hiển thị", included: true },
      { text: "Đính kèm 15 ảnh mỗi tin", included: true },
      { text: "Phân tích tin đăng: Nâng cao", included: true },
      { text: "Hỗ trợ ưu tiên 24/7", included: true },
      { text: "25 credit đẩy tin/năm", included: true },
      { text: "Huy hiệu xác thực Pro", included: true },
    ],
    highlight: true,
    ctaText: "Đăng ký ngay",
    ctaHref: "/auth/register?role=LANDLORD",
  },
];

const COMPARISON_ROWS = [
  {
    icon: <ShieldCheck className="h-4 w-4 text-gray-400" />,
    label: "Tin đăng hiển thị tối đa",
    free: "10 tin",
    pro: "50 tin",
  },
  {
    icon: <ImageIcon className="h-4 w-4 text-gray-400" />,
    label: "Ảnh đính kèm mỗi tin",
    free: "5 ảnh",
    pro: "15 ảnh",
  },
  {
    icon: <Zap className="h-4 w-4 text-gray-400" />,
    label: "Credit đẩy tin (Boost)",
    free: null,
    pro: "2/tháng · 25/năm",
  },
  {
    icon: <BarChart3 className="h-4 w-4 text-gray-400" />,
    label: "Báo cáo & phân tích",
    free: "Cơ bản",
    pro: "Nâng cao · Thời gian thực",
  },
  {
    icon: <Sparkles className="h-4 w-4 text-gray-400" />,
    label: "Huy hiệu xác thực Pro",
    free: null,
    pro: "Có",
  },
];

export default function PricingPage() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  function scrollReveal(delay = 0) {
    if (prefersReducedMotion) return {};
    return {
      initial: "hidden",
      whileInView: "show",
      viewport: { once: true, amount: 0.15 as const },
      variants: {
        hidden: { opacity: 0, y: 16 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] as const },
        },
      },
    };
  }

  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA]">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Home className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">
              RentSpace
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="hidden sm:block text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Đăng nhập
            </Link>
            <Link
              href="/auth/register"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Đăng ký chủ nhà
            </Link>
          </div>
        </div>
      </header>

      {/* ── Header ── */}
      <section className="bg-white border-b border-gray-100 py-16 md:py-20 text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...scrollReveal(0)}>
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-600">
              Gói dịch vụ
            </span>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-gray-900 mt-3 mb-4">
              Gói hội viên &amp; giá dịch vụ
            </h1>
            <p className="text-base text-gray-600 leading-relaxed max-w-[55ch] mx-auto">
              Nâng tầm hiệu quả cho thuê phòng trọ với các đặc quyền hiển thị
              và đẩy tin thông minh từ RentSpace.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Pricing Cards ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start"
          variants={stagger}
          initial={prefersReducedMotion ? {} : "hidden"}
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
        >
          {PLANS.map((plan) => {
            const isFree = plan.name === "FREE";
            const isHighlight = plan.highlight;

            return (
              <motion.div
                key={plan.id}
                variants={fadeUp}
                onClick={() => router.push(plan.ctaHref)}
                className={`relative flex flex-col rounded-2xl bg-white cursor-pointer transition-shadow ${
                  isHighlight
                    ? "border-2 border-blue-600 shadow-[0_8px_24px_rgba(37,99,235,0.12)]"
                    : "border border-gray-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
                } ${isHighlight ? "md:-translate-y-2" : ""}`}
              >
                {/* Popular badge */}
                {isHighlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-xs font-semibold px-4 py-1 rounded-full whitespace-nowrap">
                      Phổ biến nhất
                    </span>
                  </div>
                )}

                {/* Card header */}
                <div className="p-7 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 text-lg">
                      {plan.displayName}
                    </h3>
                    {plan.badge && (
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          isHighlight
                            ? "bg-blue-50 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-500 mb-5">{plan.description}</p>

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-gray-900">
                      {plan.priceLabel}
                    </span>
                    {plan.period && (
                      <span className="text-sm text-gray-400">{plan.period}</span>
                    )}
                  </div>

                  {"savingBadge" in plan && plan.savingBadge && (
                    <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 rounded-full">
                      <span className="text-xs font-semibold text-emerald-700">
                        {plan.savingBadge}
                      </span>
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="p-7 flex-1 flex flex-col justify-between gap-6">
                  <ul className="space-y-3">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        {f.included ? (
                          <Check className="h-4 w-4 text-blue-600 shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-gray-300 shrink-0" />
                        )}
                        <span
                          className={
                            f.included ? "text-gray-700" : "text-gray-400"
                          }
                        >
                          {f.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plan.ctaHref}
                    onClick={(e) => e.stopPropagation()}
                    className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
                      isHighlight
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : isFree
                        ? "bg-gray-100 hover:bg-gray-200 text-gray-800"
                        : "border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700"
                    }`}
                  >
                    {plan.ctaText}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ── Comparison Table ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <motion.div {...scrollReveal(0)}>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 mb-8 text-center">
            So sánh chi tiết quyền lợi
          </h2>

          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto] bg-gray-50 border-b border-gray-200">
              <div className="p-4 text-sm font-semibold text-gray-700">
                Tính năng
              </div>
              <div className="p-4 text-sm font-semibold text-gray-700 text-center w-28">
                Free
              </div>
              <div className="p-4 text-sm font-semibold text-blue-600 text-center w-44">
                Seller Pro
              </div>
            </div>

            {COMPARISON_ROWS.map((row, i) => (
              <div
                key={i}
                className={`grid grid-cols-[1fr_auto_auto] ${
                  i < COMPARISON_ROWS.length - 1
                    ? "border-b border-gray-100"
                    : ""
                }`}
              >
                <div className="p-4 flex items-center gap-2.5 text-sm text-gray-700">
                  {row.icon}
                  {row.label}
                </div>
                <div className="p-4 text-center text-sm text-gray-600 w-28 flex items-center justify-center">
                  {row.free ? (
                    row.free
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </div>
                <div className="p-4 text-center text-sm font-semibold text-blue-600 w-44 flex items-center justify-center">
                  {row.pro}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 bg-white py-8 text-center text-xs text-gray-400">
        © 2026 RentSpace. Bảo lưu mọi quyền.
      </footer>
    </div>
  );
}
