"use client"

import { X } from "lucide-react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import type { ExtractedParams } from "@/types/search"

const ROOM_TYPE_LABEL: Record<string, string> = {
  PHONG_TRO: "Phòng trọ",
  CHUNG_CU_MINI: "Chung cư mini",
  CHUNG_CU: "Chung cư",
  NGAN_GIAN: "Ngăn gian",
  NHA_NGUYEN_CAN: "Nhà nguyên căn",
}

interface TagProps {
  label: string
  onRemove: () => void
}

function Tag({ label, onRemove }: TagProps) {
  const shouldReduce = useReducedMotion()
  return (
    <motion.span
      initial={shouldReduce ? {} : { opacity: 0, scale: 0.85 }}
      animate={shouldReduce ? {} : { opacity: 1, scale: 1 }}
      exit={shouldReduce ? {} : { opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.15 }}
      className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs font-medium text-blue-700 select-none"
    >
      {label}
      <button
        onClick={onRemove}
        className="ml-0.5 flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-blue-200 transition-colors"
        aria-label={`Xóa ${label}`}
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </motion.span>
  )
}

interface Props {
  params: ExtractedParams
  onRemove: (field: keyof ExtractedParams) => void
}

export function ExtractedParamsTags({ params, onRemove }: Props) {
  const hasAnyParam = Object.entries(params).some(([k, v]) => k !== "keywords" ? v !== null : v !== null)

  if (!hasAnyParam) return null

  return (
    <div className="flex flex-wrap items-center gap-2 px-1 pt-1">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 shrink-0">
        AI hiểu:
      </span>
      <AnimatePresence mode="popLayout">
        {params.city && (
          <Tag
            key="city"
            label={`📍 ${params.city}`}
            onRemove={() => onRemove("city")}
          />
        )}
        {params.district && (
          <Tag
            key="district"
            label={`Quận ${params.district}`}
            onRemove={() => onRemove("district")}
          />
        )}
        {params.maxPrice && (
          <Tag
            key="maxPrice"
            label={`Dưới ${(params.maxPrice / 1_000_000).toLocaleString("vi-VN")} triệu`}
            onRemove={() => onRemove("maxPrice")}
          />
        )}
        {params.minPrice && (
          <Tag
            key="minPrice"
            label={`Trên ${(params.minPrice / 1_000_000).toLocaleString("vi-VN")} triệu`}
            onRemove={() => onRemove("minPrice")}
          />
        )}
        {params.minArea && (
          <Tag
            key="minArea"
            label={`≥ ${params.minArea} m²`}
            onRemove={() => onRemove("minArea")}
          />
        )}
        {params.roomType && (
          <Tag
            key="roomType"
            label={ROOM_TYPE_LABEL[params.roomType] ?? params.roomType}
            onRemove={() => onRemove("roomType")}
          />
        )}
        {params.hasWifi && (
          <Tag key="wifi" label="Có WiFi" onRemove={() => onRemove("hasWifi")} />
        )}
        {params.hasAirConditioner && (
          <Tag key="ac" label="Có điều hòa" onRemove={() => onRemove("hasAirConditioner")} />
        )}
        {params.hasParking && (
          <Tag key="parking" label="Có chỗ để xe" onRemove={() => onRemove("hasParking")} />
        )}
        {params.hasWashingMachine && (
          <Tag key="washing" label="Có máy giặt" onRemove={() => onRemove("hasWashingMachine")} />
        )}
        {params.keywords && (
          <Tag
            key="keywords"
            label={`"${params.keywords}"`}
            onRemove={() => onRemove("keywords")}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
