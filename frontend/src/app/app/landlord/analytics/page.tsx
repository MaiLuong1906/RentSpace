"use client";

import { useState } from "react";
import {
  useLandlordAnalytics,
  useLandlordFunnel,
  useLandlordRevenue,
} from "@/hooks/useAnalytics";
import ConversionFunnel from "@/components/analytics/ConversionFunnel";
import RevenueBarChart from "@/components/analytics/RevenueBarChart";
import {
  Eye,
  MessageSquare,
  DollarSign,
  TrendingUp,
  Loader2,
  Calendar,
  Filter,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type FunnelPreset = "7d" | "30d" | "90d" | "ytd";

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getDateRange(preset: FunnelPreset): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  if (preset === "7d") from.setDate(from.getDate() - 7);
  else if (preset === "30d") from.setDate(from.getDate() - 30);
  else if (preset === "90d") from.setDate(from.getDate() - 90);
  else from.setMonth(0, 1);
  return { from: formatDate(from), to: formatDate(to) };
}

const FUNNEL_PRESETS: { key: FunnelPreset; label: string }[] = [
  { key: "7d", label: "7 ngày" },
  { key: "30d", label: "30 ngày" },
  { key: "90d", label: "90 ngày" },
  { key: "ytd", label: "Năm nay" },
];

export default function LandlordAnalyticsPage() {
  const { data: apiResponse, isLoading, error } = useLandlordAnalytics();

  const [funnelPreset, setFunnelPreset] = useState<FunnelPreset>("30d");
  const funnelRange = getDateRange(funnelPreset);
  const { data: funnelRes, isLoading: funnelLoading } = useLandlordFunnel(
    funnelRange.from,
    funnelRange.to
  );

  const currentYear = new Date().getFullYear();
  const [revenueYear, setRevenueYear] = useState(currentYear);
  const { data: revenueRes, isLoading: revenueLoading } = useLandlordRevenue(revenueYear);

  const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-gray-50 flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Đang tải báo cáo thống kê...</p>
      </div>
    );
  }

  if (error || !apiResponse) {
    return (
      <div className="min-h-[100dvh] bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-xl max-w-md w-full">
          <h3 className="font-bold text-red-800 text-lg mb-2">Co loi xay ra</h3>
          <p className="text-red-700 text-sm">
            Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.
          </p>
        </div>
      </div>
    );
  }

  const { totalViews, totalMessages, totalDeposits, viewsOverTime } = apiResponse.data;
  const conversationRate =
    totalViews > 0 ? ((totalMessages / totalViews) * 100).toFixed(1) : "0.0";
  const depositRate =
    totalViews > 0 ? ((totalDeposits / totalViews) * 100).toFixed(1) : "0.0";

  const chartData = viewsOverTime.map((item) => {
    const dateObj = new Date(item.date);
    const shortDate = `${String(dateObj.getDate()).padStart(2, "0")}/${String(
      dateObj.getMonth() + 1
    ).padStart(2, "0")}`;
    return { name: shortDate, views: item.views, fullDate: item.date };
  });

  return (
    <div className="min-h-[100dvh] bg-gray-50/50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Thống kê hiệu quả</h1>
            <p className="text-gray-600 mt-1 text-sm">
              Phân tích hiệu suất tin đăng trong 30 ngày qua
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm font-semibold">
            <Calendar className="h-4 w-4 text-blue-600" />
            30 ngày gần nhất
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Lượt xem
              </span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Eye className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {totalViews.toLocaleString("vi-VN")}
            </div>
            <div className="text-xs text-gray-400 mt-1">Lượt xem chi tiết</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Hội thoại
              </span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <MessageSquare className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {totalMessages.toLocaleString("vi-VN")}
            </div>
            <div className="text-xs text-gray-400 mt-1">Tỷ lệ: {conversationRate}%</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Đặt cọc
              </span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {totalDeposits.toLocaleString("vi-VN")}
            </div>
            <div className="text-xs text-gray-400 mt-1">Tỷ lệ chốt: {depositRate}%</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Chuyển đổi
              </span>
              <div className="p-2 bg-violet-50 text-violet-600 rounded-lg">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {totalViews > 0
                ? ((totalDeposits / totalViews) * 100).toFixed(2)
                : "0.00"}
              %
            </div>
            <div className="text-xs text-gray-400 mt-1">Trên tổng lượt xem</div>
          </div>
        </div>

        {/* Area Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Xu hướng lượt xem (30 ngày)
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload as { fullDate: string; views: number };
                      const formattedDate = new Date(d.fullDate).toLocaleDateString("vi-VN", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      });
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-lg border border-slate-800">
                          <p className="font-semibold">{formattedDate}</p>
                          <p className="text-blue-400 mt-1 font-bold">
                            Lượt xem: {d.views}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorViews)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Funnel + Revenue — 2 col on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Conversion Funnel */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Filter className="h-5 w-5 text-blue-600" />
                Phễu chuyển đổi
              </h3>
              <div className="flex gap-1">
                {FUNNEL_PRESETS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setFunnelPreset(p.key)}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                      funnelPreset === p.key
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            {funnelLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
              </div>
            ) : funnelRes?.data ? (
              <ConversionFunnel data={funnelRes.data} />
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">Chưa có dữ liệu</p>
            )}
          </div>

          {/* Revenue Bar Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                Doanh thu theo tháng
              </h3>
              <div className="flex gap-1">
                {yearOptions.map((y) => (
                  <button
                    key={y}
                    onClick={() => setRevenueYear(y)}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                      revenueYear === y
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
            {revenueLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
              </div>
            ) : revenueRes?.data ? (
              <RevenueBarChart data={revenueRes.data} />
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">Chưa có dữ liệu</p>
            )}
          </div>
        </div>

        {/* Detail table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-sm">Chi tiết lượt xem theo ngày</h3>
          </div>
          <div className="overflow-x-auto max-h-80">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Ngày
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Lượt xem
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...viewsOverTime].reverse().map((item) => (
                  <tr key={item.date} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 text-sm font-medium text-gray-700">
                      {new Date(item.date).toLocaleDateString("vi-VN", {
                        weekday: "short",
                        day: "numeric",
                        month: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3 text-sm font-bold text-gray-900">
                      {item.views.toLocaleString("vi-VN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
