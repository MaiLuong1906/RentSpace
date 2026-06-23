"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { TrendingDown, TrendingUp, AlertCircle, Info, Sparkles } from "lucide-react";
import { getPriceSuggestion, PriceSuggestionResponse } from "@/lib/api/price-suggestion.api";
import { formatPrice } from "@/lib/mockData";

// Bản đồ ánh xạ loại phòng từ frontend sang backend enum
const FRONTEND_TO_BACKEND_ROOM_TYPE: Record<string, string> = {
  single: "PHONG_TRO",
  shared: "NGAN_GIAN",
  apartment: "CHUNG_CU",
  studio: "CHUNG_CU_MINI",
  house: "NHA_NGUYEN_CAN",
};

interface PriceSuggestionWidgetProps {
  city: string;
  district: string;
  roomType: string;
  area: number;
  currentPrice: number;
}

export function PriceSuggestionWidget({
  city,
  district,
  roomType,
  area,
  currentPrice,
}: PriceSuggestionWidgetProps) {
  const [suggestion, setSuggestion] = useState<PriceSuggestionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const fetchSuggestion = async () => {
      if (!city || !district || !roomType || !area || area <= 0) {
        setSuggestion(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const backendRoomType = FRONTEND_TO_BACKEND_ROOM_TYPE[roomType] || "PHONG_TRO";
        const data = await getPriceSuggestion(city, district, backendRoomType, area);
        setSuggestion(data);
      } catch (err) {
        console.error("Lỗi khi tải gợi ý giá:", err);
        setError("Không thể tải gợi ý giá vào lúc này.");
      } finally {
        setLoading(false);
      }
    };

    // Debounce API call 500ms
    const timer = setTimeout(fetchSuggestion, 500);
    return () => clearTimeout(timer);
  }, [city, district, roomType, area]);

  if (!city || !district || !roomType || !area || area <= 0) {
    return (
      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-sm text-blue-705 flex items-start gap-2.5">
        <Info className="h-4.5 w-4.5 text-blue-600 shrink-0 mt-0.5" />
        <p>
          Nhập đầy đủ <strong>Khu vực</strong>, <strong>Loại phòng</strong> và <strong>Diện tích</strong> để nhận gợi ý giá thuê thông minh từ RentSpace.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-5 w-32 bg-gray-200 rounded-md"></div>
          <div className="h-4 w-40 bg-gray-200 rounded-md"></div>
        </div>
        <div className="h-3 w-full bg-gray-200 rounded-full"></div>
        <div className="grid grid-cols-3 gap-2">
          <div className="h-10 bg-gray-150 rounded-lg"></div>
          <div className="h-10 bg-gray-150 rounded-lg"></div>
          <div className="h-10 bg-gray-150 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700 flex items-start gap-2.5">
        <AlertCircle className="h-4.5 w-4.5 text-red-600 shrink-0 mt-0.5" />
        <p>{error}</p>
      </div>
    );
  }

  if (!suggestion) return null;

  const { p25Price, p50Price, p75Price, sampleCount, dataSource, isFallback } = suggestion;

  // Xác định vị trí của giá hiện tại trên thanh đo (%)
  const getPercentage = () => {
    if (!currentPrice || currentPrice <= 0) return 0;
    const minRange = p25Price * 0.5; // Dưới P25 50%
    const maxRange = p75Price * 1.5; // Trên P75 50%
    
    if (currentPrice <= minRange) return 0;
    if (currentPrice >= maxRange) return 100;
    
    return ((currentPrice - minRange) / (maxRange - minRange)) * 100;
  };

  // Xác định phân khúc giá và thông điệp tư vấn
  const getPriceAnalysis = () => {
    if (!currentPrice || currentPrice <= 0) {
      return {
        label: "Chưa nhập giá",
        color: "text-gray-500",
        bgColor: "bg-gray-100",
        borderColor: "border-gray-200",
        message: "Vui lòng nhập giá thuê để so sánh với thị trường.",
        icon: Info,
      };
    }

    if (currentPrice < p25Price) {
      return {
        label: "Giá cực kỳ cạnh tranh (Rẻ)",
        color: "text-emerald-700",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
        message: "Mức giá này thấp hơn phần lớn phòng trọ tương tự. Tin đăng của bạn sẽ thu hút khách thuê cực kỳ nhanh chóng!",
        icon: TrendingDown,
      };
    } else if (currentPrice <= p50Price) {
      return {
        label: "Giá cạnh tranh tốt (Bình dân)",
        color: "text-emerald-600",
        bgColor: "bg-emerald-50/50",
        borderColor: "border-emerald-100",
        message: "Mức giá nằm trong phân khúc bình dân, dễ dàng tiếp cận số đông người thuê.",
        icon: TrendingDown,
      };
    } else if (currentPrice <= p75Price) {
      return {
        label: "Giá hợp lý (Trung bình)",
        color: "text-amber-700",
        bgColor: "bg-amber-50/50",
        borderColor: "border-amber-100",
        message: "Mức giá ở mức trung bình của thị trường. Hãy đảm bảo phòng trọ sạch sẽ, đầy đủ tiện nghi để tăng tính cạnh tranh.",
        icon: Info,
      };
    } else {
      return {
        label: "Giá cao so với khu vực",
        color: "text-red-700",
        bgColor: "bg-red-50/50",
        borderColor: "border-red-100",
        message: "Mức giá này cao hơn 75% phòng trọ tương đương. Thích hợp cho phòng cao cấp, studio đầy đủ nội thất và dịch vụ tốt.",
        icon: TrendingUp,
      };
    }
  };

  const analysis = getPriceAnalysis();
  const positionPercentage = getPercentage();

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-5 transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
      
      {/* Header widget */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-150 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <h3 className="font-semibold text-gray-900 text-sm md:text-base">Gợi ý giá thuê thông minh</h3>
        </div>
        <div className="text-xs text-gray-500 flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200">
          <span>
            {isFallback 
              ? `Fallback: Toàn bộ ${city}` 
              : `Khu vực: ${district}, ${city}`
            }
          </span>
          {sampleCount > 0 && (
            <>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span>Dựa trên {sampleCount} mẫu ({dataSource === "DEPOSIT" ? "Hợp đồng" : "Tin đăng"})</span>
            </>
          )}
        </div>
      </div>

      {/* Thang đo giá trị P25, P50, P75 */}
      <div className="space-y-6">
        
        {/* Visual Gauge */}
        <div className="relative pt-4 pb-2">
          {/* Thanh màu sắc Gradient mềm (Emerald -> Amber -> Red) */}
          <div className="h-3 w-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 relative shadow-inner">
            
            {/* Vạch mốc P25 */}
            <div className="absolute left-[33%] top-0 h-full w-0.5 bg-white/60"></div>
            
            {/* Vạch mốc P50 */}
            <div className="absolute left-[50%] top-0 h-full w-0.5 bg-white/80"></div>
            
            {/* Vạch mốc P75 */}
            <div className="absolute left-[66%] top-0 h-full w-0.5 bg-white/60"></div>
          </div>

          {/* Con trỏ giá hiện tại */}
          {currentPrice > 0 && (
            <motion.div
              className="absolute -top-1.5 flex flex-col items-center"
              initial={shouldReduceMotion ? { left: `${positionPercentage}%` } : { left: "0%" }}
              animate={{ left: `${positionPercentage}%` }}
              transition={{ type: "spring", stiffness: 80, damping: 15 }}
              style={{ x: "-50%" }}
            >
              <div className="h-5 w-5 bg-white border-3 border-blue-600 rounded-full shadow-md flex items-center justify-center cursor-pointer">
                <div className="h-1.5 w-1.5 bg-blue-600 rounded-full"></div>
              </div>
              <span className="text-[10px] font-bold text-blue-600 mt-1 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 whitespace-nowrap">
                {formatPrice(currentPrice)}
              </span>
            </motion.div>
          )}
        </div>

        {/* Labels cho các mốc P25, P50, P75 */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="space-y-1 p-2 bg-emerald-50/30 rounded-xl border border-emerald-100/50">
            <p className="text-emerald-700 font-semibold">Phổ thông (P25)</p>
            <p className="font-bold text-gray-800 text-sm">{formatPrice(p25Price)}</p>
          </div>
          <div className="space-y-1 p-2 bg-blue-50/20 rounded-xl border border-blue-100/50">
            <p className="text-blue-700 font-semibold">Trung vị (P50)</p>
            <p className="font-bold text-gray-800 text-sm">{formatPrice(p50Price)}</p>
          </div>
          <div className="space-y-1 p-2 bg-red-50/20 rounded-xl border border-red-100/50">
            <p className="text-red-700 font-semibold">Cao cấp (P75)</p>
            <p className="font-bold text-gray-800 text-sm">{formatPrice(p75Price)}</p>
          </div>
        </div>
      </div>

      {/* Phân tích kết quả giá thuê landlord nhập */}
      {currentPrice > 0 && (
        <div className={`p-4 rounded-xl border ${analysis.bgColor} ${analysis.borderColor} flex gap-3 items-start transition-all`}>
          <analysis.icon className={`h-5 w-5 shrink-0 mt-0.5 ${analysis.color}`} />
          <div className="space-y-1">
            <h4 className={`font-bold text-sm ${analysis.color}`}>{analysis.label}</h4>
            <p className="text-xs text-gray-650 leading-relaxed font-medium">
              {analysis.message}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
