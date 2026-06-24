"use client";

import { useState } from "react";
import { useAdminSummary, useTopLandlords } from "@/hooks/useAnalytics";
import {
  DollarSign,
  Users,
  BarChart2,
  TrendingUp,
  Loader2,
  Trophy,
} from "lucide-react";

type DatePreset = "7d" | "30d" | "90d" | "ytd" | "all";

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getDateRange(preset: DatePreset): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  if (preset === "7d") from.setDate(from.getDate() - 7);
  else if (preset === "30d") from.setDate(from.getDate() - 30);
  else if (preset === "90d") from.setDate(from.getDate() - 90);
  else if (preset === "ytd") from.setMonth(0, 1);
  else from.setFullYear(2020, 0, 1);
  return { from: formatDate(from), to: formatDate(to) };
}

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: "7d", label: "7 ngày" },
  { key: "30d", label: "30 ngày" },
  { key: "90d", label: "90 ngày" },
  { key: "ytd", label: "Năm nay" },
  { key: "all", label: "Tất cả" },
];

const RANK_COLORS = ["text-yellow-500", "text-gray-400", "text-amber-600"];

export default function AdminAnalyticsPage() {
  const [preset, setPreset] = useState<DatePreset>("30d");
  const { from, to } = getDateRange(preset);

  const { data: summaryRes, isLoading: summaryLoading } = useAdminSummary(from, to);
  const { data: topRes, isLoading: topLoading } = useTopLandlords(from, to, 10);

  const summary = summaryRes?.data;
  const topLandlords = topRes?.data ?? [];

  return (
    <div className="min-h-[100dvh] bg-gray-50/50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Báo cáo tài chính
            </h1>
            <p className="text-gray-600 mt-1 text-sm">
              Tổng quan doanh thu và hoạt động nền tảng
            </p>
          </div>
          <div className="flex gap-1 flex-wrap">
            {DATE_PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPreset(p.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  preset === p.key
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        {summaryLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Tổng doanh thu
                </span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {(summary?.totalRevenue ?? 0).toLocaleString("vi-VN")}đ
              </div>
              <div className="text-xs text-gray-400 mt-1">Tiền cọc đã giải phóng</div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Giao dịch
                </span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <BarChart2 className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {(summary?.totalTransactions ?? 0).toLocaleString("vi-VN")}
              </div>
              <div className="text-xs text-gray-400 mt-1">Giao dịch thành công</div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Chủ trọ hoạt động
                </span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {(summary?.activeLandlords ?? 0).toLocaleString("vi-VN")}
              </div>
              <div className="text-xs text-gray-400 mt-1">Có giao dịch trong kỳ</div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Phí nền tảng
                </span>
                <div className="p-2 bg-violet-50 text-violet-600 rounded-lg">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {(summary?.platformFee ?? 0).toLocaleString("vi-VN")}đ
              </div>
              <div className="text-xs text-gray-400 mt-1">Doanh thu nền tảng</div>
            </div>
          </div>
        )}

        {/* Top Landlords Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <h3 className="font-bold text-gray-900 text-sm">Top chủ trọ doanh thu cao nhất</h3>
          </div>

          {topLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
            </div>
          ) : topLandlords.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-400">Chưa có dữ liệu trong kỳ này</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-12">
                      #
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Chủ trọ
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Giao dịch
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Doanh thu
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topLandlords.map((landlord, idx) => (
                    <tr
                      key={landlord.landlordId}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <span
                          className={`text-sm font-bold ${
                            idx < 3 ? RANK_COLORS[idx] : "text-gray-400"
                          }`}
                        >
                          {idx + 1}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">
                            {landlord.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {landlord.displayName}
                            </div>
                            <div className="text-xs text-gray-400">ID #{landlord.landlordId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-sm font-medium text-gray-700">
                          {landlord.dealCount.toLocaleString("vi-VN")}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-sm font-bold text-gray-900">
                          {landlord.revenue.toLocaleString("vi-VN")}đ
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
