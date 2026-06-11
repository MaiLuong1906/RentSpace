"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { 
  Users, 
  Lightbulb, 
  TrendingUp, 
  HelpCircle, 
  PlusCircle, 
  Loader2,
  BookOpen,
  ShieldAlert,
  ArrowDown
} from "lucide-react";
import { postApi } from "@/lib/api/post.api";
import type { Post } from "@/types/phase2.types";
import { PostCard, CreatePostModal } from "@/components/community";
import { toast } from "sonner";

type FilterType = "ALL" | "ROOMMATE" | "TIPS" | "REVIEW" | "QUESTION";

const FILTER_ITEMS = [
  { value: "ALL", label: "Tất cả tin", icon: BookOpen, color: "border-indigo-100 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50" },
  { value: "ROOMMATE", label: "Tìm ở ghép", icon: Users, color: "border-emerald-100 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50" },
  { value: "TIPS", label: "Kinh nghiệm", icon: Lightbulb, color: "border-amber-100 text-amber-700 bg-amber-50/50 hover:bg-amber-50" },
  { value: "REVIEW", label: "Đánh giá", icon: TrendingUp, color: "border-blue-100 text-blue-700 bg-blue-50/50 hover:bg-blue-50" },
  { value: "QUESTION", label: "Hỏi đáp", icon: HelpCircle, color: "border-rose-100 text-rose-700 bg-rose-50/50 hover:bg-rose-50" },
] as const;

export default function CommunityPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ? Number(session.user.id) : undefined;

  const [posts, setPosts] = useState<Post[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>("ALL");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchPosts = useCallback(async (pageToFetch: number, filter: FilterType, append = false) => {
    setIsLoading(true);
    try {
      const typeParam = filter === "ALL" ? undefined : filter;
      const res = await postApi.getPosts({
        page: pageToFetch,
        size: 10,
        type: typeParam,
      });

      if (res.success && res.data) {
        const fetchedPosts = res.data.content || [];
        if (append) {
          setPosts((prev) => [...prev, ...fetchedPosts]);
        } else {
          setPosts(fetchedPosts);
        }
        setPage(pageToFetch);
        // Kiểm tra xem còn trang tiếp theo hay không dựa trên số lượng trả về
        setHasMore(fetchedPosts.length === 10);
      }
    } catch (err) {
      console.error("Lỗi khi tải bài đăng:", err);
      toast.error("Không thể tải bảng tin cộng đồng. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch initial posts on load
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPosts(0, "ALL", false);
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchPosts]);

  // Handle filter change
  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    fetchPosts(0, filter, false);
  };

  // Handle load more
  const handleLoadMore = () => {
    if (isLoading || !hasMore) return;
    fetchPosts(page + 1, activeFilter, true);
  };

  // Callback when a post is hidden (e.g. reported & auto-hidden)
  const handlePostHidden = (postId: number) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleOpenCreateModal = () => {
    if (!currentUserId) {
      toast.error("Bạn phải đăng nhập để đăng bài viết mới.");
      return;
    }
    setShowCreateModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Cộng đồng RentSpace</h1>
            <p className="text-sm text-gray-500 mt-1">Kết nối, chia sẻ kinh nghiệm và tìm kiếm bạn cùng phòng hoàn hảo.</p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:shadow-indigo-200 transition duration-200"
          >
            <PlusCircle size={20} />
            <span>Tạo bài viết mới</span>
          </button>
        </div>

        {/* Main Grid Layout: Feed (Left) & Rules/Info (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Feed Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Filter Navigation */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex gap-2 overflow-x-auto scrollbar-none">
              {FILTER_ITEMS.map((item) => {
                const Icon = item.icon;
                const isSelected = activeFilter === item.value;
                return (
                  <button
                    key={item.value}
                    onClick={() => handleFilterChange(item.value)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs md:text-sm border transition whitespace-nowrap ${
                      isSelected
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100"
                        : "bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Posts List */}
            {posts.length === 0 && !isLoading ? (
              <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center shadow-sm">
                <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl">
                  ✍️
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Chưa có bài viết nào</h3>
                <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
                  {activeFilter === "ALL" 
                    ? "Hãy là người đầu tiên chia sẻ thông tin hoặc tìm kiếm bạn ở ghép với cộng đồng!"
                    : "Hiện chưa có bài đăng nào thuộc chủ đề này."
                  }
                </p>
                <button
                  onClick={handleOpenCreateModal}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-100 transition"
                >
                  Đăng bài viết ngay
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={currentUserId}
                    onPostHidden={handlePostHidden}
                  />
                ))}

                {/* Loading Skeleton during scroll */}
                {isLoading && page > 0 && (
                  <div className="flex items-center justify-center py-4 text-gray-400 text-sm gap-2">
                    <Loader2 size={16} className="animate-spin text-indigo-600" /> Đang tải thêm bài viết...
                  </div>
                )}

                {/* Load More Button */}
                {hasMore && !isLoading && (
                  <button
                    onClick={handleLoadMore}
                    className="w-full py-3 border border-indigo-100 rounded-2xl bg-indigo-50/20 hover:bg-indigo-50/50 text-indigo-600 hover:text-indigo-700 font-bold text-sm flex items-center justify-center gap-1.5 transition duration-200"
                  >
                    Tải thêm bài viết <ArrowDown size={16} />
                  </button>
                )}
              </div>
            )}

            {/* Main Loading Indicator */}
            {isLoading && page === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
                <Loader2 size={32} className="animate-spin text-indigo-600" />
                <span className="text-sm font-medium">Đang tải bảng tin cộng đồng...</span>
              </div>
            )}
          </div>

          {/* Sidebar (Right Column) */}
          <div className="space-y-6">
            
            {/* Rules and Guidelines */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
                <ShieldAlert size={18} className="text-amber-500" /> Quy tắc cộng đồng
              </h3>
              <ul className="space-y-3 text-xs md:text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-semibold">•</span>
                  <span><strong>Tôn trọng lẫn nhau:</strong> Không sử dụng ngôn từ kích động, đe dọa hoặc quấy rối thành viên khác.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-semibold">•</span>
                  <span><strong>Thông tin chính xác:</strong> Đảm bảo thông tin tìm ở ghép hoặc chia sẻ kinh nghiệm là đúng sự thật.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-semibold">•</span>
                  <span><strong>Không Spam:</strong> Không đăng tải các nội dung quảng cáo trùng lặp hoặc lừa đảo.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-semibold">•</span>
                  <span><strong>Tự động kiểm duyệt:</strong> Bài viết nhận đủ 3 báo cáo vi phạm từ các thành viên khác sẽ tự động bị ẩn để quản trị viên phê duyệt lại.</span>
                </li>
              </ul>
            </div>

            {/* Quick Tips Box */}
            <div className="bg-indigo-900 text-indigo-100 rounded-3xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
                <Lightbulb size={120} />
              </div>
              <h3 className="font-bold text-white text-base mb-2 flex items-center gap-2">
                💡 Mẹo tìm ở ghép
              </h3>
              <p className="text-xs leading-relaxed opacity-90">
                Để tìm được bạn cùng phòng ăn ý nhanh hơn, bạn nên mô tả chi tiết về thói quen sinh hoạt (giờ giấc, hút thuốc, thú cưng...) và tính cách của mình trong nội dung bài đăng nhé!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Post Modal Component */}
      {showCreateModal && currentUserId && (
        <CreatePostModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onPostCreated={() => fetchPosts(0, activeFilter, false)}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}
