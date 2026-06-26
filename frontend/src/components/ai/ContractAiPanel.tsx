"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  Bot,
  Loader2,
  Send,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { contractAiApi } from "@/lib/api/contract-ai.api";
import { cn } from "@/lib/utils";

type ChatRole = "user" | "assistant" | "error";

interface ChatMessage {
  role: ChatRole;
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "Điều khoản tiền cọc có gì tôi cần lưu ý?",
  "Khi nào tôi có thể đơn phương chấm dứt hợp đồng?",
  "Nếu bên kia vi phạm điều khoản thì tôi làm gì?",
];

export function ContractAiPanel({ contractId }: { contractId: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const shouldReduceMotion = useReducedMotion();

  const { data: quotaData } = useQuery({
    queryKey: ["ai-quota", contractId],
    queryFn: () => contractAiApi.getQuota(contractId),
  });

  const quota = quotaData?.data;
  const remaining = quota ? quota.limit - quota.used : null;
  const isQuotaExceeded = quota ? quota.used >= quota.limit : false;

  const { mutate: ask, isPending } = useMutation({
    mutationFn: (question: string) => contractAiApi.ask(contractId, question),
    onSuccess: (res) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.data.answer },
      ]);
      queryClient.invalidateQueries({ queryKey: ["ai-quota", contractId] });
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      const message =
        axiosError?.response?.data?.message ||
        "Không thể kết nối AI. Vui lòng thử lại.";
      setMessages((prev) => [...prev, { role: "error", content: message }]);
    },
  });

  // Scroll xuống cuối khi có tin nhắn mới
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isPending]);

  // Focus input khi mở panel
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = (question?: string) => {
    const q = (question ?? input).trim();
    if (!q || isPending || isQuotaExceeded) return;
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setInput("");
    ask(q);
  };

  return (
    <>
      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.92, y: 12 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.92, y: 12 }
            }
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-[5rem] right-4 z-50 flex h-[480px] w-[22rem] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white sm:right-6 sm:w-96"
            style={{
              transformOrigin: "bottom right",
              boxShadow: "0 8px 40px rgba(0,0,0,0.14)",
            }}
          >
            {/* Header */}
            <div className="flex flex-none items-center justify-between border-b border-gray-100 px-4 py-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-900">
                    Hỏi AI về hợp đồng
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-gray-400">
                  {remaining !== null
                    ? `Còn ${remaining}/${quota?.limit} câu hỏi hôm nay`
                    : "Đang tải..."}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto px-4 py-3"
            >
              {/* Suggested questions */}
              {messages.length === 0 && !isPending && (
                <div className="pt-2">
                  <p className="mb-3 text-center text-xs text-gray-400">
                    Hỏi tôi về bất kỳ điều khoản nào trong hợp đồng
                  </p>
                  <div className="space-y-1.5">
                    {SUGGESTED_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => handleSend(q)}
                        disabled={isPending || isQuotaExceeded}
                        className="block w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-left text-xs text-gray-600 transition-colors hover:border-blue-100 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={shouldReduceMotion ? {} : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className={cn(
                      "flex gap-2",
                      msg.role === "user" ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    {/* Avatar */}
                    <div
                      className={cn(
                        "mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full",
                        msg.role === "user"
                          ? "bg-blue-600"
                          : msg.role === "error"
                            ? "bg-red-100"
                            : "bg-gray-100"
                      )}
                    >
                      {msg.role === "user" ? (
                        <User className="h-3 w-3 text-white" />
                      ) : msg.role === "error" ? (
                        <AlertCircle className="h-3 w-3 text-red-500" />
                      ) : (
                        <Bot className="h-3 w-3 text-gray-500" />
                      )}
                    </div>

                    {/* Bubble */}
                    <div
                      className={cn(
                        "max-w-[82%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-xs leading-relaxed",
                        msg.role === "user"
                          ? "rounded-tr-sm bg-blue-600 text-white"
                          : msg.role === "error"
                            ? "rounded-tl-sm border border-red-100 bg-red-50 text-red-700"
                            : "rounded-tl-sm border border-gray-100 bg-gray-50 text-gray-700"
                      )}
                    >
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing indicator */}
              {isPending && (
                <div className="flex gap-2">
                  <div className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-gray-100">
                    <Bot className="h-3 w-3 text-gray-500" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm border border-gray-100 bg-gray-50 px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex-none border-t border-gray-100 px-4 py-3">
              {isQuotaExceeded ? (
                <p className="py-1 text-center text-xs text-amber-600">
                  Đã hết giới hạn hôm nay. Thử lại vào ngày mai.
                </p>
              ) : (
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && !e.shiftKey && handleSend()
                    }
                    placeholder="Hỏi về điều khoản hợp đồng..."
                    disabled={isPending}
                    className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isPending}
                    className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-blue-600 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                    ) : (
                      <Send className="h-3.5 w-3.5 text-white" />
                    )}
                  </button>
                </div>
              )}
              <p className="mt-1.5 text-[10px] leading-tight text-gray-400">
                Câu trả lời mang tính tham khảo, không thay thế tư vấn pháp lý.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating bubble button */}
      <motion.button
        onClick={() => setIsOpen((prev) => !prev)}
        whileHover={shouldReduceMotion ? {} : { scale: 1.06 }}
        whileTap={shouldReduceMotion ? {} : { scale: 0.94 }}
        className="fixed bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white sm:right-6"
        style={{ boxShadow: "0 4px 20px rgba(37,99,235,0.4)" }}
        aria-label={isOpen ? "Đóng AI chat" : "Mở AI chat"}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.span
              key="close"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-5 w-5" />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ opacity: 0, rotate: 90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: -90 }}
              transition={{ duration: 0.15 }}
            >
              <Sparkles className="h-5 w-5" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
