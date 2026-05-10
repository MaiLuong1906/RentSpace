"use client";

import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/lib/api/auth.api";
import { signIn, signOut } from "next-auth/react";
import type { RegisterRequest } from "@/types/user.types";

export function useAuth() {
  const { user, isAuthenticated, isLoading, setUser, clearAuth, setLoading } =
    useAuthStore();

  const register = async (data: RegisterRequest) => {
    setLoading(true);
    try {
      await authApi.register(data);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      return result;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = () => signIn("google");

  const logout = async () => {
    clearAuth();
    await signOut({ callbackUrl: "/" });
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    register,
    login,
    loginWithGoogle,
    logout,
  };
}
