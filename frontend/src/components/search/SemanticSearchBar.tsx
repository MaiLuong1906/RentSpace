"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Sparkles, Loader2, RotateCcw } from "lucide-react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { toast } from "sonner"
import { semanticSearch } from "@/lib/api/semantic-search.api"
import { ExtractedParamsTags } from "./ExtractedParamsTags"
import type { ExtractedParams, SemanticSearchResult } from "@/types/search"
import type { Listing } from "@/types/listing.types"

const EXAMPLE_QUERIES = [
  "Phòng trọ Đà Nẵng dưới 3 triệu, có wifi",
  "Chung cư mini Hà Nội từ 4-6 triệu, có điều hòa",
  "Nhà nguyên căn quận 7 TP.HCM, có chỗ để xe",
  "Phòng rộng tối thiểu 25m², gần đại học",
]

interface Props {
  onResults: (listings: Listing[], meta: { extractedParams: ExtractedParams; usedFallback: boolean; totalElements: number }) => void
  onQuery?: (query: string) => void
  onAutoSearchDone?: () => void
  compact?: boolean
  initialQuery?: string
  autoSearch?: boolean
}

export function SemanticSearchBar({ onResults, onQuery, onAutoSearchDone, compact = false, initialQuery = "", autoSearch = false }: Props) {
  const [query, setQuery] = useState(initialQuery)
  const [isSearching, setIsSearching] = useState(false)
  const [lastResult, setLastResult] = useState<SemanticSearchResult | null>(null)
  const [charCount, setCharCount] = useState(initialQuery.length)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const shouldReduce = useReducedMotion()

  const handleSearch = useCallback(async (overrideParams?: Partial<ExtractedParams>) => {
    const trimmed = query.trim()
    if (!trimmed || isSearching) return

    setIsSearching(true)
    try {
      let result: SemanticSearchResult

      if (overrideParams && lastResult) {
        // Re-search với params đã chỉnh: rebuild query string đơn giản
        const merged = { ...lastResult.extractedParams, ...overrideParams }
        const rebuildQuery = buildQueryString(merged, trimmed)
        result = await semanticSearch(rebuildQuery)
      } else {
        result = await semanticSearch(trimmed)
      }

      setLastResult(result)
      onQuery?.(trimmed)
      onResults(result.listings, {
        extractedParams: result.extractedParams,
        usedFallback: result.usedFallback,
        totalElements: result.totalElements,
      })

      if (result.usedFallback) {
        toast.info("Đang hiển thị kết quả toàn quốc. Hãy thử mô tả chi tiết hơn.")
      }
    } catch {
      toast.error("Không thể thực hiện tìm kiếm. Vui lòng thử lại.")
    } finally {
      setIsSearching(false)
    }
  }, [query, isSearching, lastResult, onResults, onQuery])

  const handleRemoveParam = useCallback((field: keyof ExtractedParams) => {
    if (!lastResult) return
    const updated = { ...lastResult.extractedParams, [field]: null }
    setLastResult((prev) => prev ? { ...prev, extractedParams: updated } : null)
    handleSearch({ [field]: null })
  }, [lastResult, handleSearch])

  // Auto-search 1 lần khi mount (dùng khi navigate từ bubble với query có sẵn)
  useEffect(() => {
    if (autoSearch && initialQuery.trim()) {
      const t = setTimeout(() => {
        handleSearch()
        onAutoSearchDone?.()
      }, 0)
      return () => clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleReset = () => {
    setQuery("")
    setCharCount(0)
    setLastResult(null)
    onResults([], { extractedParams: emptyParams(), usedFallback: false, totalElements: 0 })
    textareaRef.current?.focus()
  }

  const handleExampleClick = (example: string) => {
    setQuery(example)
    setCharCount(example.length)
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSearch()
    }
  }

  const showTags = lastResult && !lastResult.usedFallback &&
    Object.values(lastResult.extractedParams).some((v) => v !== null)

  return (
    <div className="space-y-3">
      {/* Textarea + Actions */}
      <div className="relative">
        <div className="absolute left-3 top-3 pointer-events-none">
          <Sparkles className="h-4 w-4 text-blue-500" />
        </div>

        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setCharCount(e.target.value.length)
          }}
          onKeyDown={handleKeyDown}
          placeholder="Mô tả phòng bạn muốn thuê... Ví dụ: phòng trọ Đà Nẵng dưới 3 triệu có wifi"
          maxLength={500}
          rows={compact ? 2 : 3}
          className="w-full pl-9 pr-32 py-3 border border-gray-200 rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-gray-50/50 placeholder:text-gray-400 leading-relaxed"
        />

        {/* Char counter */}
        {charCount > 400 && (
          <span className={`absolute right-28 bottom-3 text-[10px] font-medium ${charCount >= 490 ? "text-red-400" : "text-gray-400"}`}>
            {charCount}/500
          </span>
        )}

        {/* Action buttons */}
        <div className="absolute right-2 bottom-2 flex gap-1.5">
          {(query || lastResult) && (
            <button
              onClick={handleReset}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              title="Đặt lại"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => handleSearch()}
            disabled={isSearching || !query.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all active:scale-95"
          >
            {isSearching ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            <span>{isSearching ? "Đang phân tích..." : "Tìm ngay"}</span>
          </button>
        </div>
      </div>

      {/* Extracted Params Tags — ẩn trong compact mode */}
      <AnimatePresence>
        {showTags && !compact && (
          <motion.div
            initial={shouldReduce ? {} : { opacity: 0, y: -6 }}
            animate={shouldReduce ? {} : { opacity: 1, y: 0 }}
            exit={shouldReduce ? {} : { opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <ExtractedParamsTags
              params={lastResult!.extractedParams}
              onRemove={handleRemoveParam}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Example queries — ẩn trong compact mode */}
      {!lastResult && !isSearching && !compact && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] font-semibold text-gray-400 self-center">Thử:</span>
          {EXAMPLE_QUERIES.map((ex) => (
            <button
              key={ex}
              onClick={() => handleExampleClick(ex)}
              className="px-2.5 py-1 text-[11px] bg-white border border-gray-200 rounded-full text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors font-medium"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {/* Fallback notice */}
      {lastResult?.usedFallback && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 font-medium">
          AI chưa nhận diện được yêu cầu. Đang hiển thị toàn bộ phòng trọ. Thử mô tả khu vực, giá, hoặc tiện ích cụ thể hơn.
        </p>
      )}
    </div>
  )
}

function emptyParams(): ExtractedParams {
  return {
    city: null, district: null, minPrice: null, maxPrice: null,
    minArea: null, roomType: null, hasWifi: null, hasAirConditioner: null,
    hasParking: null, hasWashingMachine: null, keywords: null,
  }
}

function buildQueryString(params: ExtractedParams, fallback: string): string {
  const parts: string[] = []
  if (params.city) parts.push(params.city)
  if (params.district) parts.push(`quận ${params.district}`)
  if (params.roomType) {
    const labels: Record<string, string> = {
      PHONG_TRO: "phòng trọ", CHUNG_CU_MINI: "chung cư mini",
      CHUNG_CU: "chung cư", NGAN_GIAN: "ngăn gian", NHA_NGUYEN_CAN: "nhà nguyên căn",
    }
    parts.push(labels[params.roomType] ?? params.roomType)
  }
  if (params.minPrice) parts.push(`trên ${(params.minPrice / 1_000_000).toFixed(0)} triệu`)
  if (params.maxPrice) parts.push(`dưới ${(params.maxPrice / 1_000_000).toFixed(0)} triệu`)
  if (params.minArea) parts.push(`tối thiểu ${params.minArea}m²`)
  if (params.hasWifi) parts.push("có wifi")
  if (params.hasAirConditioner) parts.push("có điều hòa")
  if (params.hasParking) parts.push("có chỗ để xe")
  if (params.hasWashingMachine) parts.push("có máy giặt")
  if (params.keywords) parts.push(params.keywords)
  return parts.length > 0 ? parts.join(", ") : fallback
}
