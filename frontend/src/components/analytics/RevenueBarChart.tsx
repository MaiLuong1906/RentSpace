"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { MonthlyRevenueDto } from "@/types/analytics.types";

interface Props {
  data: MonthlyRevenueDto[];
}

const MONTH_LABELS = ["T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12"];

export default function RevenueBarChart({ data }: Props) {
  const chartData = MONTH_LABELS.map((name, i) => {
    const found = data.find((d) => d.month === i + 1);
    return {
      name,
      revenue: found?.revenue ?? 0,
      depositCount: found?.depositCount ?? 0,
    };
  });

  const formatRevenue = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}tr`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
    return v.toLocaleString("vi-VN");
  };

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
          tick={{ fill: "#64748b", fontSize: 11 }}
          tickFormatter={formatRevenue}
          width={40}
        />
        <Tooltip
          cursor={{ fill: "#f8fafc" }}
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const d = payload[0].payload as { name: string; revenue: number; depositCount: number };
              return (
                <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-lg border border-slate-800">
                  <p className="font-semibold mb-1">Tháng {d.name}</p>
                  <p className="text-blue-400">
                    Doanh thu: {d.revenue.toLocaleString("vi-VN")}đ
                  </p>
                  <p className="text-emerald-400">Giao dịch: {d.depositCount}</p>
                </div>
              );
            }
            return null;
          }}
        />
        <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}
