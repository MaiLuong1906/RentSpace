"use client";

import { useState } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
  Users,
  Lightbulb,
  HelpCircle,
  PlusCircle,
  Image as ImageIcon,
  Send,
  MoreHorizontal,
} from "lucide-react";

type PostType = "review" | "roommate" | "tips" | "question";

interface Post {
  id: string;
  type: PostType;
  userId: string;
  userName: string;
  userAvatar: string;
  userVerified: boolean;
  content: string;
  images?: string[];
  tags?: string[];
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  createdAt: string;
}

interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

function getPostTypeInfo(type: PostType) {
  switch (type) {
    case "roommate":
      return { icon: Users, label: "Tìm bạn ở ghép", color: "text-purple-600 bg-purple-50" };
    case "tips":
      return { icon: Lightbulb, label: "Tips & Kinh nghiệm", color: "text-yellow-600 bg-yellow-50" };
    case "review":
      return { icon: TrendingUp, label: "Review phòng trọ", color: "text-blue-600 bg-blue-50" };
    case "question":
      return { icon: HelpCircle, label: "Hỏi đáp", color: "text-green-600 bg-green-50" };
  }
}

export default function CommunityPage() {
  const [activeFilter, setActiveFilter] = useState<PostType | "all">("all");
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // Thực tế sẽ fetch từ API khi backend hỗ trợ community posts
  const posts: Post[] = [];

  const filteredPosts =
    activeFilter === "all"
      ? posts
      : posts.filter((post) => post.type === activeFilter);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Cộng đồng</h1>
          <button
            onClick={() => setShowCreatePost(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            <PlusCircle className="h-5 w-5" />
            <span className="hidden sm:inline">Tạo bài viết</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {(["all", "roommate", "tips", "review", "question"] as const).map((filter) => {
              const info = filter === "all" ? null : getPostTypeInfo(filter);
              const Icon = info?.icon;
              const label =
                filter === "all"
                  ? "Tất cả"
                  : info?.label ?? filter;
              const activeColor =
                filter === "all"
                  ? "bg-blue-600 text-white"
                  : filter === "roommate"
                    ? "bg-purple-600 text-white"
                    : filter === "tips"
                      ? "bg-yellow-600 text-white"
                      : filter === "review"
                        ? "bg-blue-600 text-white"
                        : "bg-green-600 text-white";

              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeFilter === filter
                      ? activeColor
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Posts Feed */}
        <div className="space-y-6">
          {filteredPosts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="text-5xl mb-4">✍️</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {activeFilter === "all"
                  ? "Chưa có bài viết nào"
                  : "Chưa có bài viết ở danh mục này"}
              </h3>
              <p className="text-gray-500 mb-6">
                Hãy là người đầu tiên chia sẻ với cộng đồng!
              </p>
              <button
                onClick={() => setShowCreatePost(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Tạo bài viết ngay
              </button>
            </div>
          ) : (
            filteredPosts.map((post) => {
              const typeInfo = getPostTypeInfo(post.type);
              const TypeIcon = typeInfo.icon;

              return (
                <div key={post.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                  {/* Post Header */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={post.userAvatar}
                          alt={post.userName}
                          className="w-12 h-12 rounded-full"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{post.userName}</span>
                            {post.userVerified && (
                              <span className="text-blue-600">✓</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatDate(post.createdAt)}
                          </div>
                        </div>
                      </div>
                      <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <MoreHorizontal className="h-5 w-5 text-gray-600" />
                      </button>
                    </div>

                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${typeInfo.color}`}>
                      <TypeIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">{typeInfo.label}</span>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="p-4">
                    <p className="text-gray-900 whitespace-pre-wrap mb-4">{post.content}</p>

                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {post.images && post.images.length > 0 && (
                      <div className={`grid gap-2 mb-4 ${post.images.length === 1 ? "" : "grid-cols-2"}`}>
                        {post.images.map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Post image ${index + 1}`}
                            className="w-full rounded-lg object-cover"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Post Actions */}
                  <div className="px-4 pb-4 border-t border-gray-200 pt-3">
                    <div className="flex items-center gap-6">
                      <button
                        className={`flex items-center gap-2 ${post.isLiked ? "text-red-600" : "text-gray-600 hover:text-red-600"
                          }`}
                      >
                        <Heart className={`h-5 w-5 ${post.isLiked ? "fill-current" : ""}`} />
                        <span className="font-semibold">{post.likes}</span>
                      </button>

                      <button
                        onClick={() => setSelectedPost(post)}
                        className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
                      >
                        <MessageCircle className="h-5 w-5" />
                        <span className="font-semibold">{post.comments}</span>
                      </button>

                      <button className="flex items-center gap-2 text-gray-600 hover:text-green-600">
                        <Share2 className="h-5 w-5" />
                        <span className="font-semibold">{post.shares}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <CreatePostModal onClose={() => setShowCreatePost(false)} />
      )}

      {/* Post Detail Modal */}
      {selectedPost && (
        <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </div>
  );
}

// ===== Create Post Modal =====
function CreatePostModal({ onClose }: { onClose: () => void }) {
  const [postType, setPostType] = useState<PostType>("tips");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = () => {
    // TODO: Call API to create post
    console.log("Create post:", { postType, content, images });
    onClose();
  };

  const types: { value: PostType; label: string; icon: React.ElementType; activeClass: string }[] = [
    { value: "roommate", label: "Tìm bạn ở ghép", icon: Users, activeClass: "border-purple-600 bg-purple-50 text-purple-600" },
    { value: "tips", label: "Tips", icon: Lightbulb, activeClass: "border-yellow-600 bg-yellow-50 text-yellow-600" },
    { value: "review", label: "Review", icon: TrendingUp, activeClass: "border-blue-600 bg-blue-50 text-blue-600" },
    { value: "question", label: "Hỏi đáp", icon: HelpCircle, activeClass: "border-green-600 bg-green-50 text-green-600" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Tạo bài viết mới</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại bài viết
            </label>
            <div className="grid grid-cols-2 gap-3">
              {types.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setPostType(t.value)}
                  className={`p-3 border-2 rounded-lg flex items-center gap-2 ${postType === t.value ? t.activeClass : "border-gray-200"
                    }`}
                >
                  <t.icon className="h-5 w-5" />
                  <span className="font-semibold">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nội dung
            </label>
            <textarea
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Chia sẻ suy nghĩ của bạn..."
            />
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, idx) => (
                <img key={idx} src={img} alt="" className="w-full h-24 object-cover rounded-lg" />
              ))}
            </div>
          )}

          <label className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500">
            <ImageIcon className="h-5 w-5 text-gray-400" />
            <span className="text-gray-600">Thêm ảnh</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
          </label>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={!content.trim()}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300"
            >
              Đăng bài
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Post Detail Modal =====
function PostDetailModal({ post, onClose }: { post: Post; onClose: () => void }) {
  const [commentText, setCommentText] = useState("");

  // TODO: fetch comments từ API khi có backend
  const comments: Comment[] = [];

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    // TODO: Call API to submit comment
    console.log("Submit comment:", commentText);
    setCommentText("");
  };

  const typeInfo = getPostTypeInfo(post.type);
  const TypeIcon = typeInfo.icon;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Chi tiết bài viết</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              ✕
            </button>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <img src={post.userAvatar} alt={post.userName} className="w-12 h-12 rounded-full" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{post.userName}</span>
                {post.userVerified && <span className="text-blue-600">✓</span>}
              </div>
              <div className="text-sm text-gray-600">{formatDate(post.createdAt)}</div>
            </div>
          </div>

          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${typeInfo.color}`}>
            <TypeIcon className="h-4 w-4" />
            <span className="text-sm font-medium">{typeInfo.label}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-gray-900 whitespace-pre-wrap mb-4">{post.content}</p>

          {post.images && post.images.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mb-6">
              {post.images.map((img, idx) => (
                <img key={idx} src={img} alt="" className="w-full rounded-lg" />
              ))}
            </div>
          )}

          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-lg mb-4">
              Bình luận ({comments.length})
            </h3>

            {comments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Chưa có bình luận nào. Hãy là người đầu tiên!
              </p>
            ) : (
              <div className="space-y-4 mb-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <img
                      src={comment.userAvatar}
                      alt={comment.userName}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-lg p-3">
                        <div className="font-semibold text-sm mb-1">{comment.userName}</div>
                        <p className="text-gray-900">{comment.content}</p>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 px-3">
                        {formatDate(comment.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-3">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Viết bình luận..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmitComment();
              }}
            />
            <button
              onClick={handleSubmitComment}
              disabled={!commentText.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
