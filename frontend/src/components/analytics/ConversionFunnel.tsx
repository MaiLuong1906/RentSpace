"use client";

import { Eye, MessageSquare, DollarSign, CheckCircle2 } from "lucide-react";
import type { ConversionFunnelDto } from "@/types/analytics.types";

interface Props {
  data: ConversionFunnelDto;
}

const STEPS = [
  {
    key: "totalViews" as const,
    label: "Lượt xem",
    icon: Eye,
    bg: "bg-blue-50",
    text: "text-blue-600",
    bar: "bg-blue-500",
  },
  {
    key: "totalChats" as const,
    label: "Liên hệ",
    icon: MessageSquare,
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    bar: "bg-emerald-500",
  },
  {
    key: "totalDeposits" as const,
    label: "Đặt cọc",
    icon: DollarSign,
    bg: "bg-amber-50",
    text: "text-amber-600",
    bar: "bg-amber-500",
  },
  {
    key: "successfulDeals" as const,
    label: "Thành công",
    icon: CheckCircle2,
    bg: "bg-violet-50",
    text: "text-violet-600",
    bar: "bg-violet-500",
  },
];

export default function ConversionFunnel({ data }: Props) {
  const maxValue = data.totalViews || 1;
  const values: Record<keyof ConversionFunnelDto, number> = {
    totalViews: data.totalViews,
    totalChats: data.totalChats,
    totalDeposits: data.totalDeposits,
    successfulDeals: data.successfulDeals,
  };

  return (
    <div className="space-y-4">
      {STEPS.map((step, i) => {
        const value = values[step.key];
        const prevValue = i === 0 ? maxValue : (values[STEPS[i - 1].key] || 1);
        const widthPct = Math.round((value / maxValue) * 100);
        const convPct =
          i === 0
            ? null
            : prevValue > 0
            ? ((value / prevValue) * 100).toFixed(1)
            : "0.0";
        const Icon = step.icon;

        return (
          <div key={step.key} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 ${step.bg} ${step.text} rounded-lg`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-gray-700">{step.label}</span>
                {convPct !== null && (
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {convPct}% từ bước trước
                  </span>
                )}
              </div>
              <span className="text-sm font-bold text-gray-900">
                {value.toLocaleString("vi-VN")}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${step.bar} rounded-full transition-all duration-500`}
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
