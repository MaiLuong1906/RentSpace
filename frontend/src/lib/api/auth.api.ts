import apiClient from "./axios";
import type { RegisterRequest, LoginResponse } from "@/types/user.types";

export const authApi = {
  register: async (data: RegisterRequest) => {
    const response = await apiClient.post("/auth/register", data);
    return response.data;
  },

  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post("/auth/login", { email, password });
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post("/auth/logout");
    return response.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await apiClient.post("/auth/refresh", { refreshToken });
    return response.data;
  },
};
