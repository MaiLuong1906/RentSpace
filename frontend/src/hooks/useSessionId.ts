"use client";

import { useMemo } from "react";

const SESSION_KEY = "rs_session_id";

/**
 * Trả về anonymous session ID duy nhất, tạo và lưu vào localStorage nếu chưa có.
 * UUID này dùng cho interaction tracking của khách vãng lai (không đăng nhập).
 */
export function useSessionId(): string {
  return useMemo(() => {
    if (typeof window === "undefined") return "";

    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  }, []);
}
