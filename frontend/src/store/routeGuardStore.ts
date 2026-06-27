import { create } from "zustand";

export interface RouteGuardConfig {
  title: string;
  message: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}

export interface RouteGuardState {
  isOpen: boolean;
  config: RouteGuardConfig;
  showModal: (config: RouteGuardConfig) => void;
  hideModal: () => void;
}

const DEFAULT_CONFIG: RouteGuardConfig = {
  title: "",
  message: "",
  primaryLabel: "Đồng ý",
  primaryHref: "/",
};

export const ROUTE_GUARD_PRESETS: { [key: string]: RouteGuardConfig } = {
  SESSION_EXPIRED: {
    title: "Phiên đăng nhập đã hết hạn",
    message:
      "Phiên làm việc của bạn đã hết hạn để bảo vệ tài khoản. Vui lòng đăng nhập lại để tiếp tục sử dụng.",
    primaryLabel: "Đăng nhập lại",
    primaryHref: "/auth/login",
    secondaryLabel: "Về trang chủ",
    secondaryHref: "/",
  },
  UNAUTHORIZED: {
    title: "Bạn chưa đăng nhập",
    message:
      "Tính năng này yêu cầu đăng nhập. Vui lòng đăng nhập để tiếp tục.",
    primaryLabel: "Đăng nhập",
    primaryHref: "/auth/login",
    secondaryLabel: "Về trang chủ",
    secondaryHref: "/",
  },
};

export const useRouteGuardStore = create<RouteGuardState>()((set) => ({
  isOpen: false,
  config: DEFAULT_CONFIG,
  showModal: (config) => set({ isOpen: true, config }),
  hideModal: () => set({ isOpen: false }),
}));
