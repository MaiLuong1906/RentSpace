import apiClient from "./axios";
import { ApiResponse } from "@/types/api.types";

export const postApi = {
  // Lấy danh sách bài đăng
  getPosts: async (params?: { type?: string; page?: number; size?: number }) => {
    const response = await apiClient.get<ApiResponse<any[]>>("/posts", { params });
    return response.data;
  },

  // Tạo bài đăng mới
  createPost: async (data: { type: string; content: string; imageUrls?: string[]; relatedListing?: number; district?: string }) => {
    const response = await apiClient.post<ApiResponse<any>>("/posts", data);
    return response.data;
  },

  // Thích bài viết
  toggleLike: async (id: number) => {
    const response = await apiClient.post<ApiResponse<{ liked: boolean; count: number }>>(`/posts/${id}/like`);
    return response.data;
  },

  // Lấy bình luận
  getComments: async (postId: number) => {
    const response = await apiClient.get<ApiResponse<any[]>>(`/posts/${postId}/comments`);
    return response.data;
  },

  // Bình luận
  addComment: async (postId: number, content: string) => {
    const response = await apiClient.post<ApiResponse<any>>(`/posts/${postId}/comments`, { content });
    return response.data;
  },

  // Báo cáo bài viết
  reportPost: async (id: number, reason: string) => {
    const response = await apiClient.post<ApiResponse<any>>(`/posts/${id}/report`, { reason });
    return response.data;
  },
};
