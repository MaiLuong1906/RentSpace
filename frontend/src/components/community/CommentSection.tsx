"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Send, ChevronDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import type { PostComment } from "@/types/phase2.types";
import { postApi } from "@/lib/api/post.api";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";

interface CommentSectionProps {
  postId: number;
  currentUserId?: number;
  setCommentCount: React.Dispatch<React.SetStateAction<number>>;
}

export function CommentSection({ postId, currentUserId, setCommentCount }: CommentSectionProps) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentsPage, setCommentsPage] = useState(0);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const handleFetchComments = useCallback(async (pageToFetch = 0) => {
    setIsLoadingComments(true);
    try {
      const res = await postApi.getComments(postId, { page: pageToFetch, size: 5 });
      if (res.success && res.data) {
        const newComments = res.data.content;
        if (pageToFetch === 0) {
          setComments(newComments);
        } else {
          setComments((prev) => [...prev, ...newComments]);
        }
        setCommentsPage(pageToFetch);
        setHasMoreComments(newComments.length === 5);
      }
    } catch {
      toast.error("Không thể tải bình luận. Vui lòng thử lại.");
    } finally {
      setIsLoadingComments(false);
    }
  }, [postId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleFetchComments(0);
    }, 0);
    return () => clearTimeout(timer);
  }, [postId, handleFetchComments]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      toast.error("Bạn cần đăng nhập để bình luận.");
      return;
    }
    if (!commentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const res = await postApi.addComment(postId, commentText.trim());
      if (res.success && res.data) {
        setComments((prev) => [res.data, ...prev]);
        setCommentText("");
        setCommentCount((prev) => prev + 1);
        toast.success("Bình luận thành công!");
      }
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      toast.error(apiError?.response?.data?.message || "Không thể gửi bình luận. Thử lại sau.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div className="mt-4 border-t border-gray-50 pt-4 space-y-4">
      {/* Add Comment Form */}
      <form onSubmit={handleCommentSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder="Viết bình luận công khai..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          disabled={isSubmittingComment}
          maxLength={500}
        />
        <button
          type="submit"
          disabled={isSubmittingComment || !commentText.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 flex items-center justify-center transition disabled:opacity-50"
        >
          {isSubmittingComment ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>

      {/* Comments List */}
      <div className="space-y-3">
        {comments.map((comment) => {
          const commentTime = formatDistanceToNow(new Date(comment.createdAt), {
            addSuffix: true,
            locale: vi,
          });
          return (
            <div key={comment.id} className="flex items-start gap-2.5 text-sm">
              <Link href={`/app/profile/${comment.author.id}`} className="hover:opacity-90 transition flex-shrink-0">
                {comment.author.avatarUrl ? (
                  <Image
                    src={comment.author.avatarUrl}
                    alt={comment.author.name}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover mt-0.5"
                    unoptimized
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-medium flex items-center justify-center mt-0.5 text-xs">
                    {comment.author.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </Link>
              <div className="flex-1 bg-gray-50 rounded-2xl px-3 py-2 border border-gray-100">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <Link href={`/app/profile/${comment.author.id}`} className="font-semibold text-gray-900 text-xs hover:text-indigo-600 transition">
                    {comment.author.name}
                  </Link>
                  <span className="text-[10px] text-gray-400">{commentTime}</span>
                </div>
                <p className="text-gray-700 leading-relaxed text-xs md:text-sm">{comment.content}</p>
              </div>
            </div>
          );
        })}

        {isLoadingComments && (
          <div className="flex items-center justify-center py-2 text-gray-400 text-xs gap-1.5">
            <Loader2 size={14} className="animate-spin" /> Đang tải bình luận...
          </div>
        )}

        {!isLoadingComments && comments.length === 0 && (
          <p className="text-center text-xs text-gray-400 py-2">Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>
        )}

        {hasMoreComments && !isLoadingComments && (
          <button
            onClick={() => handleFetchComments(commentsPage + 1)}
            className="w-full text-center text-xs font-semibold text-indigo-600 hover:text-indigo-700 py-1.5 border border-indigo-100 rounded-lg bg-indigo-50/30 flex items-center justify-center gap-1 hover:bg-indigo-50/60 transition"
          >
            Xem thêm bình luận <ChevronDown size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
