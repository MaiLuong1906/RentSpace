"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { VerificationBanner } from "@/components/trust/VerificationBanner";
import { verificationApi } from "@/lib/api/verification.api";
import {
  Search,
  Users,
  MessageCircle,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { useListings } from "@/hooks/useListings";
import { ForYouSection } from "@/components/recommendation/ForYouSection";

const DISTRICTS = ["Hải Châu", "Thanh Khê", "Sơn Trà", "Liên Chiểu"];

export default function HomePage() {
  const { data: apiResponse } = useListings({ size: 1 });
  const totalListings =
    apiResponse?.data?.page?.totalElements ??
    apiResponse?.data?.totalElements ??
    0;

  const { data: verifyData } = useQuery({
    queryKey: ["verification-status"],
    queryFn: verificationApi.getStatus,
    retry: false,
  });
  const verificationStatus = verifyData?.data?.status ?? "NOT_STARTED";
  const isVerified = verificationStatus === "VERIFIED";

  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA]">
      <VerificationBanner isVerified={isVerified} verificationStatus={verificationStatus} />
      {/* ── Hero Search ── */}
      <section className="bg-white border-b border-gray-100 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-600">
              Nền tảng tin cậy
            </span>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-gray-900 mt-3 mb-3">
              Tìm phòng trọ lý tưởng của bạn
            </h1>
            <p className="text-base text-gray-500">
              Hơn{" "}
              <span className="font-semibold text-gray-700">
                {totalListings > 0 ? totalListings : "--"}
              </span>{" "}
              phòng trọ được xác thực tại Đà Nẵng
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <Link
              href="/app/search"
              className="flex items-center gap-3 bg-white border border-gray-200 text-gray-900 rounded-xl p-4 hover:border-blue-300 hover:shadow-[0_4px_16px_rgba(37,99,235,0.08)] transition-all"
            >
              <Search className="h-5 w-5 text-gray-400 shrink-0" />
              <span className="text-gray-400">
                Tìm theo khu vực, giá, loại phòng...
              </span>
            </Link>

            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {DISTRICTS.map((d) => (
                <Link
                  key={d}
                  href={`/app/search?district=${d}`}
                  className="px-4 py-1.5 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-600 text-sm rounded-full transition-colors"
                >
                  {d}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-white border-b border-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              {
                value: totalListings > 0 ? `${totalListings}+` : "12+",
                label: "Phòng trọ",
              },
              { value: "98%", label: "Đã xác thực" },
              { value: "4.7★", label: "Đánh giá TB" },
              { value: "24/7", label: "Hỗ trợ" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                <div className="text-sm text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For You / Trending ── */}
      <ForYouSection />

      {/* ── Community ── */}
      <section className="py-12 md:py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">
              Tham gia cộng đồng RentSpace
            </h2>
            <p className="text-sm text-gray-500">
              Kết nối, chia sẻ và học hỏi từ hàng ngàn người dùng khác
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 mb-8">
            {[
              {
                icon: <Users className="h-6 w-6 text-blue-600" />,
                title: "Tìm bạn ở ghép",
                desc: "Tìm người cùng phòng phù hợp với lối sống của bạn",
                href: "/app/roommates",
              },
              {
                icon: <TrendingUp className="h-6 w-6 text-blue-600" />,
                title: "Review chân thực",
                desc: "Đọc đánh giá từ người đã ở, tránh lừa đảo",
                href: "/app/community",
              },
              {
                icon: <MessageCircle className="h-6 w-6 text-blue-600" />,
                title: "Tips & Kinh nghiệm",
                desc: "Học hỏi từ kinh nghiệm của những người đi trước",
                href: "/app/community",
              },
            ].map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group flex flex-col gap-3 bg-[#FAFAFA] border border-gray-200 rounded-2xl p-6 hover:border-blue-200 hover:bg-blue-50/50 transition-all"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/app/community"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Khám phá cộng đồng
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA landlord ── */}
      <section className="py-12 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">
            Bạn là chủ trọ?
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Đăng tin miễn phí và tiếp cận hàng ngàn người tìm phòng mỗi ngày
          </p>
          <Link
            href="/app/landlord/create-listing"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Đăng tin ngay
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
