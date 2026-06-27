"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Sparkles, X, MapPin, Send, Trash2, ChevronRight } from "lucide-react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { assistantSearch, type ConversationTurn } from "@/lib/api/semantic-search.api"
import { formatPrice } from "@/lib/mockData"
import type { Listing } from "@/types/listing.types"

interface ChatTurn {
  id: string
  userMessage: string
  aiMessage: string
  listings: Listing[]
  totalElements: number
  usedFallback: boolean
}

const EXAMPLE_PROMPTS = [
  "Phòng trọ Đà Nẵng dưới 3 triệu",
  "Gần ĐH Bách Khoa, có wifi",
  "Chung cư mini Hà Nội 2-4 triệu",
]

export function SemanticSearchBubble() {
  const [isOpen, setIsOpen] = useState(false)
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [input, setInput] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [pendingMessage, setPendingMessage] = useState("")
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const shouldReduce = useReducedMotion()
  const pathname = usePathname()
  const router = useRouter()

  // Tất cả hooks phải ở đây — trước mọi return có điều kiện
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: shouldReduce ? "auto" : "smooth" })
  }, [turns, isSearching, shouldReduce])

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 120)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  // Không render trên trang search (đã có full semantic UI ở đó)
  if (pathname === "/app/search") return null

  const buildHistory = (): ConversationTurn[] =>
    turns.flatMap((turn) => [
      { role: "user", content: turn.userMessage },
      { role: "assistant", content: turn.aiMessage },
    ])

  const handleSend = async () => {
    const q = input.trim()
    if (!q || isSearching) return

    setInput("")
    setIsSearching(true)
    setPendingMessage(q)

    try {
      const history = buildHistory()
      const result = await assistantSearch(q, history.length > 0 ? history : undefined)

      setTurns((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          userMessage: q,
          aiMessage: result.message,
          listings: result.listings as unknown as Listing[],
          totalElements: result.totalElements,
          usedFallback: result.usedFallback,
        },
      ])
    } catch {
      // Giữ nguyên turns — thông báo ngầm qua việc không có response
    } finally {
      setIsSearching(false)
      setPendingMessage("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSend()
    }
  }

  const handleViewAll = (turn: ChatTurn) => {
    setIsOpen(false)
    router.push(`/app/search?q=${encodeURIComponent(turn.userMessage)}&mode=semantic`)
  }

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-3">
      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={shouldReduce ? {} : { opacity: 0, scale: 0.95, y: 12 }}
            animate={shouldReduce ? {} : { opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduce ? {} : { opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="w-[420px] bg-white rounded-2xl border border-gray-200 shadow-[0_8px_40px_rgba(0,0,0,0.14)] overflow-hidden flex flex-col"
            style={{ maxHeight: "min(580px, calc(100dvh - 5rem))" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 leading-none">Tìm phòng bằng AI</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Mô tả tự nhiên, AI tìm cho bạn</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {turns.length > 0 && (
                  <button
                    onClick={() => setTurns([])}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-500"
                    title="Xóa hội thoại"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Đóng"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Chat area */}
            <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-4">
              {/* Empty state */}
              {turns.length === 0 && !isSearching && (
                <div className="text-center py-4">
                  <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="h-5 w-5 text-blue-500" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">Hỏi AI về phòng trọ</p>
                  <p className="text-[11px] text-gray-400 mt-1 max-w-[260px] mx-auto leading-relaxed">
                    Mô tả yêu cầu bằng tiếng Việt. AI sẽ tìm phòng và nhớ ngữ cảnh để bạn hỏi tiếp.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
                    {EXAMPLE_PROMPTS.map((ex) => (
                      <button
                        key={ex}
                        onClick={() => setInput(ex)}
                        className="text-[11px] px-2.5 py-1 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-600 rounded-full transition-colors"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Conversation turns */}
              {turns.map((turn) => (
                <div key={turn.id} className="space-y-2">
                  {/* User bubble */}
                  <div className="flex justify-end">
                    <div className="max-w-[78%] bg-blue-600 text-white rounded-2xl rounded-tr-sm px-3 py-2">
                      <p className="text-xs leading-relaxed">{turn.userMessage}</p>
                    </div>
                  </div>

                  {/* AI response */}
                  <div className="space-y-2">
                    {/* AI message bubble */}
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-3 py-2 mr-8">
                      <p className="text-xs text-gray-700 leading-relaxed">{turn.aiMessage}</p>
                      {turn.usedFallback && turn.listings.length > 0 && (
                        <span className="text-[10px] text-amber-500 font-medium mt-1 block">
                          Kết quả mở rộng — không tìm thấy đúng yêu cầu ban đầu
                        </span>
                      )}
                    </div>

                    {/* Listing cards */}
                    {turn.listings.slice(0, 3).map((listing) => (
                      <Link
                        key={listing.id}
                        href={`/app/listings/${listing.id}`}
                        onClick={() => setIsOpen(false)}
                        className="flex gap-2.5 p-2.5 bg-white border border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/30 transition-colors mr-8"
                      >
                        <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                          <img
                            src={listing.images?.[0]?.imageUrl ?? "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=200&h=200&fit=crop"}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-gray-800 line-clamp-1">{listing.title}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin className="h-2.5 w-2.5 text-gray-400 flex-shrink-0" />
                            <p className="text-[10px] text-gray-500 truncate">
                              {listing.district ? `${listing.district}, ` : ""}{listing.city}
                            </p>
                          </div>
                          <p className="text-[11px] font-bold text-blue-600 mt-1">
                            {formatPrice(listing.pricePerMonth)}/tháng
                          </p>
                        </div>
                      </Link>
                    ))}

                    {/* View all */}
                    {turn.totalElements > 0 && (
                      <button
                        onClick={() => handleViewAll(turn)}
                        className="flex items-center gap-1 text-[11px] text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                      >
                        <ChevronRight className="h-3 w-3" />
                        Xem tất cả {turn.totalElements > turn.listings.length ? `${turn.totalElements}+` : turn.totalElements} kết quả
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Pending turn (user sent, AI thinking) */}
              {isSearching && pendingMessage && (
                <>
                  <div className="flex justify-end">
                    <div className="max-w-[78%] bg-blue-600 text-white rounded-2xl rounded-tr-sm px-3 py-2">
                      <p className="text-xs leading-relaxed">{pendingMessage}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-3 py-2.5 w-fit mr-8">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-gray-400">AI đang phân tích...</span>
                  </div>
                </>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input area */}
            <div className="flex-shrink-0 border-t border-gray-100 p-3">
              <div className="flex gap-2 items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-blue-300 focus-within:bg-white transition-colors">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    turns.length > 0
                      ? "Hỏi tiếp... (vd: rẻ hơn, chỉ ở Hải Châu, có wifi)"
                      : "Mô tả phòng bạn cần..."
                  }
                  className="flex-1 text-xs bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
                  disabled={isSearching}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isSearching}
                  className="w-6 h-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
                  aria-label="Gửi"
                >
                  <Send className="h-3 w-3 text-white" />
                </button>
              </div>
              {turns.length > 0 && (
                <p className="text-[10px] text-gray-300 mt-1.5 text-center">
                  AI nhớ ngữ cảnh — hỏi tiếp tự nhiên như chat
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={shouldReduce ? {} : { scale: 1.06 }}
        whileTap={shouldReduce ? {} : { scale: 0.94 }}
        className="relative w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center transition-colors"
        aria-label="Tìm phòng bằng AI"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.span
              key="close"
              initial={shouldReduce ? {} : { rotate: -90, opacity: 0 }}
              animate={shouldReduce ? {} : { rotate: 0, opacity: 1 }}
              exit={shouldReduce ? {} : { rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-5 w-5" />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={shouldReduce ? {} : { rotate: 90, opacity: 0 }}
              animate={shouldReduce ? {} : { rotate: 0, opacity: 1 }}
              exit={shouldReduce ? {} : { rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Sparkles className="h-5 w-5" />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Pulse dot khi chưa có hội thoại nào */}
        {!isOpen && turns.length === 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white" />
        )}
      </motion.button>
    </div>
  )
}
