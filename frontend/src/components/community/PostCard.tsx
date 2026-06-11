"use client";

import { useState } from "react";
import { 
  Heart, 
  MessageCircle, 
  Flag, 
  ShieldCheck, 
  ExternalLink, 
  Loader2, 
  ChevronDown, 
  Send 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import type { Post, PostComment } from "@/types/phase2.types";
import { postApi } from "@/lib/api/post.api";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";

interface PostCardProps {
  post: Post;
  currentUserId?: number;
  onPostHidden?: (postId: number) => void;
}

const TYPE_COLORS = {
  ROOMMATE: "bg-emerald-50 text-emerald-700 border-emerald-100",
  TIPS: "bg-amber-50 text-amber-700 border-amber-100",
  REVIEW: "bg-blue-50 text-blue-700 border-blue-100",
  QUESTION: "bg-rose-50 text-rose-700 border-rose-100",
};

const TYPE_LABELS = {
  ROOMMATE: "Tìm ở ghép",
  TIPS: "Kinh nghiệm",
  REVIEW: "Đánh giá",
  QUESTION: "Hỏi đáp",
};

export function PostCard({ post, currentUserId, onPostHidden }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [isLiking, setIsLiking] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [reportCount, setReportCount] = useState(post.reportCount);

  // Comments state
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentsPage, setCommentsPage] = useState(0);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Report state
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: vi,
  });

  const handleLike = async () => {
    if (!currentUserId) {
      toast.error("Bạn phải đăng nhập để thích bài viết này.");
      return;
    }
    if (isLiking) return;

    setIsLiking(true);
    // Optimistic UI update
    const previousLiked = isLiked;
    const previousCount = likeCount;
    setIsLiked(!previousLiked);
    setLikeCount(previousLiked ? previousCount - 1 : previousCount + 1);

    try {
      const res = await postApi.toggleLike(post.id);
      setIsLiked(res.data);
      setLikeCount(res.data ? previousCount + (previousLiked ? 0 : 1) : previousCount - (previousLiked ? 1 : 0));
    } catch (err: unknown) {
      // Revert if error
      setIsLiked(previousLiked);
      setLikeCount(previousCount);
      const apiError = err as { response?: { data?: { message?: string } } };
      toast.error(apiError?.response?.data?.message || "Không thể thích bài viết. Thử lại sau.");
    } finally {
      setIsLiking(false);
    }
  };

  const handleFetchComments = async (pageToFetch = 0) => {
    setIsLoadingComments(true);
    try {
      const res = await postApi.getComments(post.id, { page: pageToFetch, size: 5 });
      if (res.success && res.data) {
        const newComments = res.data.content;
        if (pageToFetch === 0) {
          setComments(newComments);
        } else {
          setComments((prev) => [...prev, ...newComments]);
        }
        setCommentsPage(pageToFetch);
        // Kiểm tra xem còn trang tiếp theo hay không
        setHasMoreComments(newComments.length === 5);
      }
    } catch (err) {
      toast.error("Không thể tải bình luận. Vui lòng thử lại.");
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleToggleComments = () => {
    const nextShow = !showComments;
    setShowComments(nextShow);
    if (nextShow && comments.length === 0) {
      handleFetchComments(0);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      toast.error("Bạn cần đăng nhập để bình luận.");
      return;
    }
    if (!commentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const res = await postApi.addComment(post.id, commentText.trim());
      if (res.success && res.data) {
        setComments((prev) => [res.data, ...prev]);
        setCommentText("");
        setCommentCount((prev) => prev + 1);
        toast.success("Bình luận thành công!");
      }
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      toast.error(apiError?.response?.data?.message || "Không thể gửi bình luận.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      toast.error("Bạn cần đăng nhập để báo cáo.");
      return;
    }
    if (!reportReason.trim() || isReporting) return;

    setIsReporting(true);
    try {
      const res = await postApi.reportPost(post.id, reportReason.trim());
      if (res.success) {
        toast.success("Đã gửi báo cáo vi phạm. Cảm ơn phản hồi của bạn.");
        setShowReportModal(false);
        setReportReason("");
        
        // Hỗ trợ cập nhật UI nếu bài viết bị auto-hide
        const newReportCount = reportCount + 1;
        setReportCount(newReportCount);
        if (newReportCount >= 3 && onPostHidden) {
          onPostHidden(post.id);
        }
      }
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      toast.error(apiError?.response?.data?.message || "Báo cáo trùng lặp hoặc gặp lỗi.");
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-200">
      {/* Header: Author Info & Tag */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link href={`/app/profile/${post.author.id}`} className="hover:opacity-90 transition flex-shrink-0">
            {post.author.avatarUrl ? (
              <Image
                src={post.author.avatarUrl}
                alt={post.author.name}
                width={44}
                height={44}
                className="w-11 h-11 rounded-full object-cover border border-gray-100"
                unoptimized
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-indigo-50 text-indigo-600 font-semibold text-lg flex items-center justify-center">
                {post.author.name.charAt(0).toUpperCase()}
              </div>
            )}
          </Link>
          <div>
            <div className="flex items-center gap-1.5">
              <Link href={`/app/profile/${post.author.id}`} className="font-semibold text-gray-900 text-sm md:text-base hover:text-indigo-600 transition">
                {post.author.name}
              </Link>
              {post.author.kycStatus === "VERIFIED" && (
                <ShieldCheck className="w-4 h-4 text-emerald-500 fill-emerald-50" title="Tài khoản đã xác thực KYC" />
              )}
            </div>
            <span className="text-xs text-gray-400">{timeAgo}</span>
          </div>
        </div>

        {/* Post Type Tag */}
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${TYPE_COLORS[post.type]}`}>
          {TYPE_LABELS[post.type]}
        </span>
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <p className="text-gray-800 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>

        {/* Display District / Location if available */}
        {post.district && (
          <div className="mt-2 text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 inline-flex items-center gap-1 px-2 py-0.5 rounded">
            📍 Khu vực: {post.district}
          </div>
        )}
      </div>

      {/* Post Images Grid */}
      {post.imageUrls && post.imageUrls.length > 0 && (
        <div className={`grid gap-2 mb-4 rounded-xl overflow-hidden ${
          post.imageUrls.length === 1 ? "grid-cols-1" : post.imageUrls.length === 2 ? "grid-cols-2" : "grid-cols-3"
        }`}>
          {post.imageUrls.map((url, index) => (
            <div key={index} className="relative w-full h-48 md:h-56">
              <Image
                src={url}
                alt={`Ảnh bài viết ${index + 1}`}
                fill
                className="object-cover border border-gray-100 hover:scale-105 transition duration-300 cursor-pointer"
                sizes="(max-width: 768px) 100vw, 33vw"
                unoptimized
              />
            </div>
          ))}
        </div>
      )}

      {/* Related Listing Card */}
      {post.relatedListingId && (
        <div className="mb-4 bg-gray-50 border border-gray-100 rounded-xl p-3 flex items-center justify-between hover:bg-gray-100 transition">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold bg-gray-200 text-gray-700 px-2 py-0.5 rounded">Phòng trọ liên kết</span>
            <span className="text-xs text-gray-500 font-medium">Chi tiết phòng trọ được đính kèm</span>
          </div>
          <Link 
            href={`/app/listings/${post.relatedListingId}`}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
          >
            Xem phòng trọ <ExternalLink size={12} />
          </Link>
        </div>
      )}

      {/* Footer Actions (Like, Comment, Report) */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <button
          onClick={handleLike}
          disabled={isLiking}
          className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition ${
            isLiked 
              ? "text-rose-600 bg-rose-50 hover:bg-rose-100" 
              : "text-gray-500 hover:text-rose-600 hover:bg-rose-50"
          }`}
        >
          <Heart size={18} className={isLiked ? "fill-rose-600 text-rose-600" : ""} />
          <span>Thích {likeCount > 0 && `(${likeCount})`}</span>
        </button>

        <button
          onClick={handleToggleComments}
          className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition ${
            showComments 
              ? "text-indigo-600 bg-indigo-50" 
              : "text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"
          }`}
        >
          <MessageCircle size={18} />
          <span>Bình luận {commentCount > 0 && `(${commentCount})`}</span>
        </button>

        <button
          onClick={() => {
            if (!currentUserId) {
              toast.error("Bạn cần đăng nhập để báo cáo bài viết.");
              return;
            }
            setShowReportModal(true);
          }}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-amber-600 hover:bg-amber-50 px-3 py-1.5 rounded-lg transition"
          title="Báo cáo bài viết vi phạm"
        >
          <Flag size={16} />
          <span className="hidden md:inline">Báo cáo</span>
        </button>
      </div>

      {/* Comments Drawer / List */}
      {showComments && (
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
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Báo cáo vi phạm</h3>
            <p className="text-xs text-gray-500 mb-4">
              Giúp RentSpace xây dựng một cộng đồng văn minh. Hãy cho chúng tôi biết lý do bạn muốn báo cáo bài viết này.
            </p>

            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Lý do báo cáo</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Nhập lý do cụ thể (ví dụ: Tin giả, Quấy rối, Spam, Ngôn từ kích động thù địch...)"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none bg-gray-50/50"
                  maxLength={250}
                />
                <p className="text-right text-[10px] text-gray-400 mt-1">{reportReason.length}/250</p>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowReportModal(false);
                    setReportReason("");
                  }}
                  className="px-4 py-2 text-xs font-semibold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isReporting || !reportReason.trim()}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 text-xs font-semibold rounded-xl transition flex items-center gap-1 disabled:opacity-50"
                >
                  {isReporting && <Loader2 size={13} className="animate-spin" />}
                  Gửi báo cáo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
