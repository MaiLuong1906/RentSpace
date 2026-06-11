"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { 
  X, 
  Plus, 
  Loader2, 
  MapPin, 
  Link as LinkIcon, 
  ChevronDown 
} from "lucide-react";
import { postApi } from "@/lib/api/post.api";
import { listingApi } from "@/lib/api/listing.api";
import { chatApi } from "@/lib/api/chat";
import type { Listing } from "@/types/listing.types";
import { toast } from "sonner";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
  currentUserId: number;
}

const POST_TYPES = [
  { value: "ROOMMATE", label: "Tìm ở ghép", desc: "Tìm kiếm bạn cùng phòng, cùng nhà trọ" },
  { value: "TIPS", label: "Chia sẻ kinh nghiệm", desc: "Kinh nghiệm thuê phòng, tránh lừa đảo, mẹo sinh hoạt" },
  { value: "REVIEW", label: "Đánh giá khu vực", desc: "Đánh giá phòng trọ, khu phố, chủ nhà" },
  { value: "QUESTION", label: "Hỏi đáp cộng đồng", desc: "Đặt câu hỏi nhờ cộng đồng tư vấn, hỗ trợ" },
];

export function CreatePostModal({ isOpen, onClose, onPostCreated, currentUserId }: CreatePostModalProps) {
  const [type, setType] = useState("ROOMMATE");
  const [content, setContent] = useState("");
  const [district, setDistrict] = useState("");
  const [selectedListingId, setSelectedListingId] = useState<number | undefined>(undefined);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  
  // Images state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  
  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState("");

  // Tải danh sách phòng trọ của chính user để liên kết
  useEffect(() => {
    if (isOpen && currentUserId) {
      const fetchMyListings = async () => {
        try {
          const res = await listingApi.getMyListings({ page: 0, size: 50, status: "ACTIVE" });
          if (res.success && res.data?.content) {
            setMyListings(res.data.content);
          }
        } catch (err) {
          console.error("Không thể tải danh sách phòng trọ cá nhân", err);
        }
      };
      fetchMyListings();
    }
  }, [isOpen, currentUserId]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      
      // Giới hạn tối đa 5 ảnh
      if (selectedFiles.length + filesArray.length > 5) {
        toast.error("Bạn chỉ có thể chọn tối đa 5 hình ảnh.");
        return;
      }

      // Kiểm tra dung lượng từng file (max 5MB)
      const validFiles = filesArray.filter((file) => {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`File ${file.name} vượt quá dung lượng 5MB cho phép.`);
          return false;
        }
        return true;
      });

      setSelectedFiles((prev) => [...prev, ...validFiles]);

      // Tạo link preview
      const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      // Hủy ObjectURL cũ tránh leak memory
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Vui lòng nhập nội dung bài đăng.");
      return;
    }

    setIsSubmitting(true);
    try {
      const imageUrls: string[] = [];

      // Bước 1: Upload các file ảnh lên S3
      if (selectedFiles.length > 0) {
        setSubmitStep("Đang tải ảnh lên hệ thống...");
        for (const file of selectedFiles) {
          const url = await chatApi.uploadChatImage(file);
          imageUrls.push(url);
        }
      }

      // Bước 2: Tạo bài viết trên Backend
      setSubmitStep("Đang tạo bài viết...");
      const res = await postApi.createPost({
        type,
        content: content.trim(),
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        district: district.trim() || undefined,
        relatedListingId: selectedListingId,
      });

      if (res.success) {
        toast.success("Đăng bài viết lên bảng tin thành công!");
        onPostCreated();
        handleClose();
      }
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      toast.error(apiError?.response?.data?.message || "Đã xảy ra lỗi khi tạo bài viết.");
    } finally {
      setIsSubmitting(false);
      setSubmitStep("");
    }
  };

  const handleClose = () => {
    // Dọn dẹp previews tránh rò rỉ bộ nhớ
    previews.forEach((url) => URL.revokeObjectURL(url));
    setContent("");
    setDistrict("");
    setSelectedListingId(undefined);
    setSelectedFiles([]);
    setPreviews([]);
    setType("ROOMMATE");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Tạo bài đăng cộng đồng mới</h2>
          <button 
            onClick={handleClose} 
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Post Type Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Chủ đề bài đăng</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {POST_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-semibold text-left transition flex flex-col justify-between ${
                    type === t.value
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-50"
                      : "border-gray-200 hover:border-gray-300 bg-white text-gray-700"
                  }`}
                >
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* District / Location Input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <MapPin size={13} className="text-gray-400" /> Khu vực (Quận / Huyện)
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Sơn Trà, Cầu Giấy..."
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>

            {/* Related Listing Selector */}
            {myListings.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <LinkIcon size={13} className="text-gray-400" /> Đính kèm phòng trọ của bạn
                </label>
                <div className="relative">
                  <select
                    value={selectedListingId || ""}
                    onChange={(e) => setSelectedListingId(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 pr-10 text-sm border border-gray-200 rounded-xl bg-gray-50/50 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition cursor-pointer"
                  >
                    <option value="">Không đính kèm phòng trọ</option>
                    {myListings.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title} ({l.pricePerMonth.toLocaleString()}đ)
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}
          </div>

          {/* Post Content Input */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Nội dung bài viết</label>
            <textarea
              required
              rows={5}
              placeholder="Chia sẻ thông tin, nhu cầu ở ghép hoặc thắc mắc của bạn với cộng đồng tại đây..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition resize-none"
              maxLength={1000}
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-[10px] text-gray-400">Hỗ trợ nhập văn bản thuần và mô tả chi tiết.</span>
              <span className="text-xs text-gray-400 font-medium">{content.length}/1000</span>
            </div>
          </div>

          {/* Post Images Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Hình ảnh đính kèm (Tối đa 5 ảnh)</label>
            
            <div className="flex flex-wrap gap-3">
              {/* Image Previews */}
              {previews.map((previewUrl, index) => (
                <div key={index} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0 group">
                  <Image src={previewUrl} alt="Preview" width={80} height={80} className="w-full h-full object-cover" unoptimized />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 bg-black/70 hover:bg-black/90 text-white rounded-full p-1 opacity-95 transition"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}

              {/* Upload Button */}
              {previews.length < 5 && (
                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 hover:border-indigo-400 bg-gray-50/50 hover:bg-indigo-50/10 flex flex-col items-center justify-center gap-1 cursor-pointer transition flex-shrink-0">
                  <Plus size={18} className="text-gray-400" />
                  <span className="text-[10px] font-semibold text-gray-400">Chọn ảnh</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-b-2xl">
          <div className="text-xs text-gray-400">
            {isSubmitting ? (
              <span className="font-medium text-indigo-600 flex items-center gap-1.5 animate-pulse">
                <Loader2 size={13} className="animate-spin" /> {submitStep}
              </span>
            ) : (
              "Đăng tin hoàn toàn miễn phí"
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100 rounded-xl transition"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !content.trim()}
              className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-100 transition disabled:opacity-50"
            >
              Đăng bài ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
