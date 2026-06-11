import apiClient from "./axios";
import { ApiResponse, PageResponse } from "@/types/api.types";
import { Post, PostComment } from "@/types/phase2.types";

export const postApi = {
  // Lấy danh sách bài đăng (phân trang và lọc)
  getPosts: async (params?: { type?: string; page?: number; size?: number }) => {
    const response = await apiClient.get<ApiResponse<PageResponse<Post>>>("/posts", { params });
    return response.data;
  },

  // Tạo bài đăng mới
  createPost: async (data: { 
    type: string; 
    content: string; 
    imageUrls?: string[]; 
    relatedListingId?: number; 
    district?: string; 
  }) => {
    const response = await apiClient.post<ApiResponse<Post>>("/posts", data);
    return response.data;
  },

  // Thích bài viết (Like / Unlike)
  toggleLike: async (id: number) => {
    const response = await apiClient.post<ApiResponse<boolean>>(`/posts/${id}/like`);
    return response.data;
  },

  // Lấy danh sách bình luận (có phân trang)
  getComments: async (postId: number, params?: { page?: number; size?: number }) => {
    const response = await apiClient.get<ApiResponse<PageResponse<PostComment>>>(`/posts/${postId}/comments`, { params });
    return response.data;
  },

  // Thêm bình luận mới
  addComment: async (postId: number, content: string) => {
    const response = await apiClient.post<ApiResponse<PostComment>>(`/posts/${postId}/comments`, { content });
    return response.data;
  },

  // Báo cáo bài viết
  reportPost: async (id: number, reason: string) => {
    const response = await apiClient.post<ApiResponse<string>>(`/posts/${id}/report`, null, { params: { reason } });
    return response.data;
  },
};
