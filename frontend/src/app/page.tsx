"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Shield,
  Users,
  MapPin,
  Star,
  MessageCircle,
  Search,
  CheckCircle2,
  ArrowRight,
  Home,
  ChevronRight,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const STATS = [
  { value: "10.000+", label: "Người dùng" },
  { value: "5.000+", label: "Tin đăng" },
  { value: "98%", label: "KYC xác thực" },
];

const STEPS = [
  {
    step: "01",
    title: "Tạo tài khoản",
    desc: "Đăng ký và xác thực KYC bằng CCCD trong vài phút. Nhanh, an toàn, một lần duy nhất.",
  },
  {
    step: "02",
    title: "Tìm hoặc đăng tin",
    desc: "Tìm phòng trọ theo bản đồ hoặc đăng tin cho thuê với đầy đủ ảnh và tiện ích.",
  },
  {
    step: "03",
    title: "Kết nối & thuê phòng",
    desc: "Chat realtime với chủ nhà, xem review thật, ký hợp đồng và chuyển dọn.",
  },
];

export default function LandingPage() {
  const prefersReducedMotion = useReducedMotion();

  function scrollReveal(delay = 0) {
    if (prefersReducedMotion) return {};
    return {
      initial: "hidden",
      whileInView: "show",
      viewport: { once: true, amount: 0.2 as const },
      variants: {
        hidden: { opacity: 0, y: 20 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] as const },
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

          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-500">
            <Link
              href="/app/search"
              className="hover:text-gray-900 transition-colors"
            >
              Tìm phòng
            </Link>
            <Link
              href="/pricing"
              className="hover:text-gray-900 transition-colors"
            >
              Bảng giá
            </Link>
          </nav>

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
              Đăng ký
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-white border-b border-gray-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — copy */}
            <motion.div {...scrollReveal(0)}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full mb-6">
                <Shield className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-widest">
                  Nền tảng tin cậy
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight text-gray-900 mb-6">
                Tìm phòng trọ{" "}
                <span className="text-blue-600">an toàn</span>,
                <br />
                minh bạch
              </h1>

              <p className="text-base text-gray-600 leading-relaxed max-w-[55ch] mb-8">
                Nền tảng thuê phòng trọ đầu tiên tại Việt Nam tích hợp KYC xác
                thực danh tính, review chân thực và kết nối cộng đồng người thuê.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link
                  href="/app/search"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Search className="h-4 w-4" />
                  Tìm phòng ngay
                </Link>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Đăng tin cho thuê
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-8 pt-6 border-t border-gray-100">
                {STATS.map((s) => (
                  <div key={s.label}>
                    <p className="text-xl font-bold text-gray-900">{s.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right — card mockup */}
            <motion.div
              className="hidden lg:block"
              initial={prefersReducedMotion ? {} : { opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="relative px-6 py-4">
                {/* Main listing card */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_8px_32px_rgba(0,0,0,0.08)] p-5">
                  <div className="aspect-[16/10] bg-gray-100 rounded-xl mb-4 overflow-hidden flex items-center justify-center">
                    <MapPin className="h-10 w-10 text-gray-300" />
                  </div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">
                        Phòng trọ Hải Châu
                      </p>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        Đà Nẵng
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600 text-lg">
                        {(3500000).toLocaleString("vi-VN")}đ
                      </p>
                      <p className="text-xs text-gray-400">/tháng</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 rounded-full">
                      <CheckCircle2 className="h-3 w-3 text-blue-600" />
                      <span className="text-xs font-medium text-blue-700">
                        KYC đã xác thực
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 rounded-full">
                      <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-medium text-amber-700">
                        4.8
                      </span>
                    </div>
                  </div>
                </div>

                {/* Floating — new listings badge */}
                <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-xl px-4 py-2.5 shadow-[0_4px_16px_rgba(37,99,235,0.35)]">
                  <p className="text-xs font-medium opacity-80">Mới hôm nay</p>
                  <p className="text-xl font-bold leading-tight">42 tin</p>
                </div>

                {/* Floating — new users badge */}
                <div className="absolute -bottom-2 -left-2 bg-white rounded-xl px-4 py-3 border border-gray-200 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Tham gia hôm nay</p>
                      <p className="text-sm font-bold text-gray-900">
                        +128 người
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Features Bento ── */}
      <section className="py-20 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="mb-12" {...scrollReveal(0)}>
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-600">
              Tính năng
            </span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mt-2">
              Tại sao chọn RentSpace?
            </h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
            variants={stagger}
            initial={prefersReducedMotion ? {} : "hidden"}
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
          >
            {/* Large card — KYC (spans 2 cols) */}
            <motion.div
              variants={fadeUp}
              className="md:col-span-2 bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-shadow"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-5">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Xác thực danh tính KYC
              </h3>
              <p className="text-gray-600 leading-relaxed max-w-[52ch]">
                Mọi chủ nhà và người thuê đều xác thực CCCD. Không còn lo ngại
                lừa đảo hay thông tin giả mạo — mỗi tài khoản là một danh tính
                thật sự.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-full">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                  <span className="text-xs font-medium text-blue-700">
                    CCCD xác thực
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-full">
                  <Shield className="h-3.5 w-3.5 text-blue-600" />
                  <span className="text-xs font-medium text-blue-700">
                    Bảo mật dữ liệu
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Card — Review */}
            <motion.div
              variants={fadeUp}
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-shadow"
            >
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-5">
                <Star className="h-6 w-6 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Review chân thực
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Chỉ người đã thực sự ở mới được đánh giá. Không có review ảo
                hay mua bán đánh giá.
              </p>
            </motion.div>

            {/* Card — Map (spans 2 cols) */}
            <motion.div
              variants={fadeUp}
              className="md:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-shadow flex items-center gap-6"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Bản đồ tìm kiếm
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Tìm phòng trực quan theo vị trí địa lý — lọc theo khoảng
                  cách, quận, huyện và mức giá.
                </p>
              </div>
            </motion.div>

            {/* Card — Community */}
            <motion.div
              variants={fadeUp}
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-shadow"
            >
              <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center mb-5">
                <Users className="h-6 w-6 text-violet-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Tìm bạn ở ghép
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Kết nối người ở ghép phù hợp qua cộng đồng đã được kiểm chứng.
              </p>
            </motion.div>

            {/* Card — Chat */}
            <motion.div
              variants={fadeUp}
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-shadow"
            >
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-5">
                <MessageCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Chat realtime
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Nhắn tin trực tiếp với chủ trọ, giải đáp thắc mắc ngay lập
                tức, không cần qua trung gian.
              </p>
            </motion.div>

            {/* Card — Smart search (spans 1 col) */}
            <motion.div
              variants={fadeUp}
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-shadow"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-5">
                <Search className="h-6 w-6 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Tìm kiếm thông minh
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Lọc theo giá, khu vực, tiện nghi và nhiều tiêu chí khác.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="mb-14" {...scrollReveal(0)}>
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-600">
              Quy trình
            </span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mt-2">
              Bắt đầu trong 3 bước
            </h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-10 relative"
            variants={stagger}
            initial={prefersReducedMotion ? {} : "hidden"}
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
          >
            {STEPS.map((s, i) => (
              <motion.div key={s.step} variants={fadeUp} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-5 left-[calc(100%-8px)] w-full h-px bg-gray-100 z-0" />
                )}
                <div className="relative z-10">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mb-5">
                    <span className="text-xs font-bold text-white">{s.step}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {s.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 bg-[#FAFAFA]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...scrollReveal(0)}>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mb-4">
              Sẵn sàng tìm phòng trọ lý tưởng?
            </h2>
            <p className="text-base text-gray-600 leading-relaxed mb-8">
              Tham gia cộng đồng RentSpace — xác thực danh tính, tìm phòng uy
              tín ngay hôm nay.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/app/search"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Search className="h-4 w-4" />
                Tìm phòng ngay
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Đăng tin cho thuê
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-400 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Home className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="font-bold text-white">RentSpace</span>
              </div>
              <p className="text-sm leading-relaxed max-w-[28ch]">
                Nền tảng thuê phòng trọ an toàn và minh bạch cho người Việt.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Sản phẩm</h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link
                    href="/app/search"
                    className="hover:text-white transition-colors"
                  >
                    Tìm phòng
                  </Link>
                </li>
                <li>
                  <Link
                    href="/auth/register"
                    className="hover:text-white transition-colors"
                  >
                    Đăng tin
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="hover:text-white transition-colors"
                  >
                    Bảng giá
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Hỗ trợ</h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Trung tâm trợ giúp
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Liên hệ
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Pháp lý</h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Điều khoản
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Bảo mật
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-xs text-center">
            © 2026 RentSpace. Bảo lưu mọi quyền.
          </div>
        </div>
      </footer>
    </div>
  );
}
