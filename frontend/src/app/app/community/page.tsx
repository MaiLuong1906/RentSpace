"use client";

import { useState } from "react";
import Link from "next/link";
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
import { formatDate } from "@/lib/mockData";

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

export default function CommunityPage() {
  const [activeFilter, setActiveFilter] = useState<PostType | "all">("all");
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const posts: Post[] = [
    {
      id: "1",
      type: "roommate",
      userId: "user1",
      userName: "Nguyễn Văn A",
      userAvatar: "https://i.pravatar.cc/150?img=8",
      userVerified: true,
      content:
        "Tìm bạn nữ ở ghép khu vực Hải Châu! Mình là sinh viên năm 3 ĐH Bách Khoa, sạch sẽ, không hút thuốc. Phòng 2 người, giá 2tr/người. Có ai quan tâm inbox mình nhé! 🏠",
      tags: ["Hải Châu", "Sinh viên nữ", "2 triệu"],
      images: [
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
      ],
      likes: 24,
      comments: 8,
      shares: 3,
      isLiked: false,
      createdAt: "2026-05-13T09:30:00Z",
    },
    {
      id: "2",
      type: "tips",
      userId: "user2",
      userName: "Trần Thị B",
      userAvatar: "https://i.pravatar.cc/150?img=9",
      userVerified: true,
      content:
        "💡 Chia sẻ kinh nghiệm thuê trọ cho các bạn mới:\n\n1. Luôn xem phòng trực tiếp trước khi chuyển tiền cọc\n2. Kiểm tra kỹ hợp đồng, đặc biệt là điều khoản về điện nước\n3. Chụp ảnh/video tình trạng phòng lúc nhận để tránh tranh chấp sau này\n4. Hỏi rõ về qui định chung cư/khu trọ (giờ giấc, khách, nấu ăn...)\n5. Kiểm tra khóa cửa, ổ điện, máy nước nóng lạnh\n\nChúc các bạn tìm được phòng ưng ý! 🏡",
      tags: ["Tips", "Kinh nghiệm"],
      likes: 156,
      comments: 32,
      shares: 45,
      isLiked: true,
      createdAt: "2026-05-12T14:20:00Z",
    },
    {
      id: "3",
      type: "review",
      userId: "user3",
      userName: "Lê Minh C",
      userAvatar: "https://i.pravatar.cc/150?img=10",
      userVerified: false,
      content:
        "Review phòng trọ trên đường Lê Duẩn - 5⭐\n\nMình vừa chuyển vào đây được 2 tuần, phòng sạch sẽ, chủ nhà thân thiện. Khu vực an ninh tốt, gần trường, siêu thị tiện lợi. Giá 3tr5 bao điện nước, có điều hòa, nóng lạnh đầy đủ.\n\nĐiểm cộng:\n✅ Vị trí đẹp, gần trung tâm\n✅ Phòng thoáng, có ban công\n✅ Chủ nhà dễ tính\n✅ An ninh tốt\n\nĐiểm trừ:\n❌ Hơi ồn vào buổi tối do gần đường lớn\n\nTổng thể rất ok, recommend! 👍",
      images: [
        "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop",
      ],
      tags: ["Review", "Lê Duẩn", "Hải Châu"],
      likes: 89,
      comments: 15,
      shares: 12,
      isLiked: false,
      createdAt: "2026-05-11T16:45:00Z",
    },
    {
      id: "4",
      type: "question",
      userId: "user4",
      userName: "Phạm Thị D",
      userAvatar: "https://i.pravatar.cc/150?img=5",
      userVerified: true,
      content:
        "Các bạn cho mình hỏi với! Mình đang thuê trọ ở Thanh Khê, giờ muốn chuyển trọ trước hạn 1 tháng thì có mất tiền cọc không nhỉ? Hợp đồng có ghi là phải báo trước 1 tháng nhưng mình có việc gấp phải chuyển luôn.\n\nCó ai gặp trường hợp tương tự không? Tư vấn mình với! 🙏",
      tags: ["Hỏi đáp", "Hợp đồng"],
      likes: 12,
      comments: 24,
      shares: 2,
      isLiked: false,
      createdAt: "2026-05-13T11:15:00Z",
    },
    {
      id: "5",
      type: "roommate",
      userId: "user5",
      userName: "Hoàng Văn E",
      userAvatar: "https://i.pravatar.cc/150?img=12",
      userVerified: true,
      content:
        "Tìm 1 bạn nam ở ghép khu Sơn Trà, view biển cực đẹp! 🌊\n\nMình đang làm IT, đi làm sáng về chiều. Phòng 2 người, hiện tại chỉ mình mình ở, cần tìm thêm 1 bạn.\n\nThông tin:\n- Giá: 3tr/người (bao điện nước)\n- Phòng: 30m2, full nội thất, có ban công view biển\n- Ưu tiên: Đi làm, sạch sẽ, không hút thuốc\n\nAi quan tâm inbox mình nhé! Mình sẽ gửi ảnh phòng.",
      tags: ["Sơn Trà", "Nam", "IT"],
      images: [
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
      ],
      likes: 34,
      comments: 11,
      shares: 5,
      isLiked: true,
      createdAt: "2026-05-12T10:00:00Z",
    },
    {
      id: "6",
      type: "tips",
      userId: "user6",
      userName: "Võ Thị F",
      userAvatar: "https://i.pravatar.cc/150?img=1",
      userVerified: true,
      content:
        "Mẹo tiết kiệm tiền điện khi thuê trọ! ⚡💰\n\nMình vừa nhận hoá đơn điện tháng này chỉ 150k cho phòng 1 người (có điều hoà). Chia sẻ vài tips:\n\n1️⃣ Điều hoà: Set 26-27 độ, tắt khi ra ngoài > 2 tiếng\n2️⃣ Tắt nguồn các thiết bị khi không dùng (đừng để chế độ chờ)\n3️⃣ Dùng đèn LED thay bóng thường\n4️⃣ Nấu ăn bằng bếp từ/gas thay vì bếp điện\n5️⃣ Giặt đồ vào ban đêm (nếu giá điện có phân khung giờ)\n\nHy vọng giúp ích được các bạn! 😊",
      tags: ["Tips", "Tiết kiệm"],
      likes: 203,
      comments: 47,
      shares: 89,
      isLiked: false,
      createdAt: "2026-05-10T08:30:00Z",
    },
  ];

  const filteredPosts =
    activeFilter === "all"
      ? posts
      : posts.filter((post) => post.type === activeFilter);

  const getPostTypeInfo = (type: PostType) => {
    switch (type) {
      case "roommate":
        return {
          icon: Users,
          label: "Tìm bạn ở ghép",
          color: "text-purple-600 bg-purple-50",
        };
      case "tips":
        return {
          icon: Lightbulb,
          label: "Tips & Kinh nghiệm",
          color: "text-yellow-600 bg-yellow-50",
        };
      case "review":
        return {
          icon: TrendingUp,
          label: "Review phòng trọ",
          color: "text-blue-600 bg-blue-50",
        };
      case "question":
        return {
          icon: HelpCircle,
          label: "Hỏi đáp",
          color: "text-green-600 bg-green-50",
        };
    }
  };

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
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeFilter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setActiveFilter("roommate")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeFilter === "roommate"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Users className="h-4 w-4" />
              Tìm bạn ở ghép
            </button>
            <button
              onClick={() => setActiveFilter("tips")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeFilter === "tips"
                  ? "bg-yellow-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Lightbulb className="h-4 w-4" />
              Tips
            </button>
            <button
              onClick={() => setActiveFilter("review")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeFilter === "review"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              Review
            </button>
            <button
              onClick={() => setActiveFilter("question")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeFilter === "question"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <HelpCircle className="h-4 w-4" />
              Hỏi đáp
            </button>
          </div>
        </div>

        {/* Posts Feed */}
        <div className="space-y-6">
          {filteredPosts.map((post) => {
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
                          <span className="font-semibold text-gray-900">
                            {post.userName}
                          </span>
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
                  <p className="text-gray-900 whitespace-pre-wrap mb-4">
                    {post.content}
                  </p>

                  {/* Tags */}
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

                  {/* Images */}
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
                <div className="px-4 pb-4">
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-6">
                      <button
                        className={`flex items-center gap-2 ${
                          post.isLiked ? "text-red-600" : "text-gray-600 hover:text-red-600"
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
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <CreatePostModal onClose={() => setShowCreatePost(false)} />
      )}

      {/* Post Detail Modal with Comments */}
      {selectedPost && (
        <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </div>
  );
}

// Create Post Modal Component
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
              <button
                onClick={() => setPostType("roommate")}
                className={`p-3 border-2 rounded-lg flex items-center gap-2 ${
                  postType === "roommate"
                    ? "border-purple-600 bg-purple-50 text-purple-600"
                    : "border-gray-200"
                }`}
              >
                <Users className="h-5 w-5" />
                <span className="font-semibold">Tìm bạn ở ghép</span>
              </button>
              <button
                onClick={() => setPostType("tips")}
                className={`p-3 border-2 rounded-lg flex items-center gap-2 ${
                  postType === "tips"
                    ? "border-yellow-600 bg-yellow-50 text-yellow-600"
                    : "border-gray-200"
                }`}
              >
                <Lightbulb className="h-5 w-5" />
                <span className="font-semibold">Tips</span>
              </button>
              <button
                onClick={() => setPostType("review")}
                className={`p-3 border-2 rounded-lg flex items-center gap-2 ${
                  postType === "review"
                    ? "border-blue-600 bg-blue-50 text-blue-600"
                    : "border-gray-200"
                }`}
              >
                <TrendingUp className="h-5 w-5" />
                <span className="font-semibold">Review</span>
              </button>
              <button
                onClick={() => setPostType("question")}
                className={`p-3 border-2 rounded-lg flex items-center gap-2 ${
                  postType === "question"
                    ? "border-green-600 bg-green-50 text-green-600"
                    : "border-gray-200"
                }`}
              >
                <HelpCircle className="h-5 w-5" />
                <span className="font-semibold">Hỏi đáp</span>
              </button>
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

// Post Detail Modal with Comments
function PostDetailModal({ post, onClose }: { post: Post; onClose: () => void }) {
  const [commentText, setCommentText] = useState("");

  const mockComments: Comment[] = [
    {
      id: "c1",
      postId: post.id,
      userId: "u1",
      userName: "Mai Hương",
      userAvatar: "https://i.pravatar.cc/150?img=20",
      content: "Cảm ơn bạn đã chia sẻ! Rất hữu ích 👍",
      createdAt: "2026-05-13T10:00:00Z",
    },
    {
      id: "c2",
      postId: post.id,
      userId: "u2",
      userName: "Tuấn Anh",
      userAvatar: "https://i.pravatar.cc/150?img=15",
      content: "Mình đang cần tìm bạn ở ghép, có thể inbox được không bạn?",
      createdAt: "2026-05-13T11:30:00Z",
    },
  ];

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    // TODO: Call API to submit comment
    console.log("Submit comment:", commentText);
    setCommentText("");
  };

  const typeInfo = (() => {
    switch (post.type) {
      case "roommate":
        return { icon: Users, label: "Tìm bạn ở ghép", color: "text-purple-600 bg-purple-50" };
      case "tips":
        return { icon: Lightbulb, label: "Tips & Kinh nghiệm", color: "text-yellow-600 bg-yellow-50" };
      case "review":
        return { icon: TrendingUp, label: "Review phòng trọ", color: "text-blue-600 bg-blue-50" };
      case "question":
        return { icon: HelpCircle, label: "Hỏi đáp", color: "text-green-600 bg-green-50" };
    }
  })();

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
              Bình luận ({mockComments.length})
            </h3>

            <div className="space-y-4 mb-6">
              {mockComments.map((comment) => (
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
              onKeyPress={(e) => {
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
