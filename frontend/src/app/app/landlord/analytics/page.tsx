"use client";

import { useLandlordAnalytics } from "@/hooks/useAnalytics";
import { Eye, MessageSquare, DollarSign, TrendingUp, Loader2, Calendar } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function LandlordAnalyticsPage() {
  const { data: apiResponse, isLoading, error } = useLandlordAnalytics();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Đang tải báo cáo thống kê...</p>
      </div>
    );
  }

  if (error || !apiResponse) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-xl max-w-md w-full shadow-md">
          <h3 className="font-bold text-red-800 text-lg mb-2">⚠️ Có lỗi xảy ra</h3>
          <p className="text-red-700 text-sm">
            Không thể tải dữ liệu thống kê của bạn lúc này. Vui lòng thử lại sau.
          </p>
        </div>
      </div>
    );
  }

  const { totalViews, totalMessages, totalDeposits, viewsOverTime } = apiResponse.data;

  // Calculate conversion rate (Views -> Messages or Deposits)
  const conversationRate = totalViews > 0 ? ((totalMessages / totalViews) * 100).toFixed(1) : "0.0";
  const depositRate = totalViews > 0 ? ((totalDeposits / totalViews) * 100).toFixed(1) : "0.0";

  // Map data to Recharts format
  const chartData = viewsOverTime.map((item) => {
    // Format date string for shorter display on axis (e.g. "12/06")
    const dateObj = new Date(item.date);
    const shortDate = `${String(dateObj.getDate()).padStart(2, "0")}/${String(dateObj.getMonth() + 1).padStart(2, "0")}`;
    return {
      name: shortDate,
      views: item.views,
      fullDate: item.date,
    };
  });

  return (
    <div className="min-h-screen bg-gray-50/50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Thống kê hiệu quả</h1>
            <p className="text-gray-600 mt-1">
              Phân tích hiệu suất hiển thị và tương tác của tin đăng trong 30 ngày qua
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm font-semibold shadow-sm">
            <Calendar className="h-4 w-4 text-blue-600" />
            30 ngày gần nhất
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Card 1: Views */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-500">Tổng lượt xem tin</span>
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Eye className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{totalViews.toLocaleString("vi-VN")}</div>
            <div className="text-xs text-gray-500 mt-2 font-medium">Lượt hiển thị chi tiết phòng</div>
          </div>

          {/* Card 2: Messages */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-500">Hội thoại mới</span>
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <MessageSquare className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{totalMessages.toLocaleString("vi-VN")}</div>
            <div className="text-xs text-gray-500 mt-2 font-medium">Tỷ lệ liên hệ: {conversationRate}%</div>
          </div>

          {/* Card 3: Deposits */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-500">Đơn đặt cọc thành công</span>
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{totalDeposits.toLocaleString("vi-VN")}</div>
            <div className="text-xs text-gray-500 mt-2 font-medium">Tỷ lệ chốt phòng: {depositRate}%</div>
          </div>

          {/* Card 4: Conversion */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-500">Chỉ số chuyển đổi</span>
              <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {totalViews > 0 ? ((totalDeposits / totalViews) * 100).toFixed(2) : "0.00"}%
            </div>
            <div className="text-xs text-gray-500 mt-2 font-medium">Tính trên tổng lượt xem</div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Biểu đồ xu hướng lượt xem phòng trọ (30 ngày)
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
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
                      const data = payload[0].payload;
                      const formattedDate = new Date(data.fullDate).toLocaleDateString("vi-VN", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      });
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-800 text-xs">
                          <p className="font-semibold">{formattedDate}</p>
                          <p className="text-blue-400 mt-1 font-bold">Lượt xem: {data.views}</p>
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
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorViews)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed stats table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-bold text-gray-900">Chi tiết lượt xem theo ngày</h3>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0 border-b border-gray-150">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ngày</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Lượt xem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {[...viewsOverTime].reverse().map((item) => (
                  <tr key={item.date} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">
                      {new Date(item.date).toLocaleDateString("vi-VN", {
                        weekday: "short",
                        day: "numeric",
                        month: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-bold">
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
