import apiClient from "./axios";
import { ApiResponse } from "@/types/api.types";
import { Post, PostComment } from "@/types/phase2.types";

export const postApi = {
  // Lấy danh sách bài đăng
  getPosts: async (params?: { type?: string; page?: number; size?: number }) => {
    const response = await apiClient.get<ApiResponse<Post[]>>("/posts", { params });
    return response.data;
  },

  // Tạo bài đăng mới
  createPost: async (data: { type: string; content: string; imageUrls?: string[]; relatedListing?: number; district?: string }) => {
    const response = await apiClient.post<ApiResponse<Post>>("/posts", data);
    return response.data;
  },

  // Thích bài viết
  toggleLike: async (id: number) => {
    const response = await apiClient.post<ApiResponse<{ liked: boolean; count: number }>>(`/posts/${id}/like`);
    return response.data;
  },

  // Lấy bình luận
  getComments: async (postId: number) => {
    const response = await apiClient.get<ApiResponse<PostComment[]>>(`/posts/${postId}/comments`);
    return response.data;
  },

  // Bình luận
  addComment: async (postId: number, content: string) => {
    const response = await apiClient.post<ApiResponse<PostComment>>(`/posts/${postId}/comments`, { content });
    return response.data;
  },

  // Báo cáo bài viết
  reportPost: async (id: number, reason: string) => {
    const response = await apiClient.post<ApiResponse<{ reportId: number }>>(`/posts/${id}/report`, { reason });
    return response.data;
  },
};
