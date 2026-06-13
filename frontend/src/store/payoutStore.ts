import { create } from "zustand";
import { payoutApi } from "@/lib/api/payout.api";
import { 
  LandlordPayoutAccount, 
  PayoutTransaction, 
  PayoutAccountRequest, 
  ProcessPayoutRequest,
  PayoutStatus
} from "@/types/payout.types";

interface PayoutState {
  payoutAccount: LandlordPayoutAccount | null;
  payoutHistory: PayoutTransaction[];
  adminPayouts: PayoutTransaction[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchPayoutAccount: () => Promise<void>;
  linkPayoutAccount: (data: PayoutAccountRequest) => Promise<void>;
  fetchPayoutHistory: (page?: number, size?: number) => Promise<{ totalElements: number; totalPages: number }>;
  fetchAdminPayouts: (status: PayoutStatus, page?: number, size?: number) => Promise<{ totalElements: number; totalPages: number }>;
  processPayout: (id: number, data: ProcessPayoutRequest) => Promise<void>;
}

interface AxiosErrorResponse {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
}

export const usePayoutStore = create<PayoutState>((set) => ({
  payoutAccount: null,
  payoutHistory: [],
  adminPayouts: [],
  isLoading: false,
  error: null,

  fetchPayoutAccount: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await payoutApi.getPayoutAccount();
      if (res.success && res.data) {
        set({ payoutAccount: res.data });
      } else {
        set({ payoutAccount: null });
      }
    } catch (err: unknown) {
      const errorRes = err as AxiosErrorResponse;
      // If 404, landlord hasn't linked bank account yet. We shouldn't throw error.
      if (errorRes.response?.status === 404) {
        set({ payoutAccount: null });
      } else {
        set({ error: errorRes.response?.data?.message || "Không thể lấy thông tin tài khoản ngân hàng" });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  linkPayoutAccount: async (data: PayoutAccountRequest) => {
    set({ isLoading: true, error: null });
    try {
      const res = await payoutApi.linkPayoutAccount(data);
      if (res.success && res.data) {
        set({ payoutAccount: res.data });
      }
    } catch (err: unknown) {
      const errorRes = err as AxiosErrorResponse;
      set({ error: errorRes.response?.data?.message || "Không thể liên kết tài khoản ngân hàng" });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchPayoutHistory: async (page = 0, size = 10) => {
    set({ isLoading: true, error: null });
    try {
      const res = await payoutApi.getPayoutHistory(page, size);
      if (res.success && res.data) {
        set({ payoutHistory: res.data.content || [] });
        return {
          totalElements: res.data.totalElements ?? res.data.page?.totalElements ?? 0,
          totalPages: res.data.totalPages ?? res.data.page?.totalPages ?? 0
        };
      }
      return { totalElements: 0, totalPages: 0 };
    } catch (err: unknown) {
      const errorRes = err as AxiosErrorResponse;
      set({ error: errorRes.response?.data?.message || "Không thể lấy lịch sử rút tiền" });
      return { totalElements: 0, totalPages: 0 };
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAdminPayouts: async (status: PayoutStatus, page = 0, size = 10) => {
    set({ isLoading: true, error: null });
    try {
      const res = await payoutApi.adminGetPayouts(status, page, size);
      if (res.success && res.data) {
        set({ adminPayouts: res.data.content || [] });
        return {
          totalElements: res.data.totalElements ?? res.data.page?.totalElements ?? 0,
          totalPages: res.data.totalPages ?? res.data.page?.totalPages ?? 0
        };
      }
      return { totalElements: 0, totalPages: 0 };
    } catch (err: unknown) {
      const errorRes = err as AxiosErrorResponse;
      set({ error: errorRes.response?.data?.message || "Không thể tải danh sách giải ngân" });
      return { totalElements: 0, totalPages: 0 };
    } finally {
      set({ isLoading: false });
    }
  },

  processPayout: async (id: number, data: ProcessPayoutRequest) => {
    set({ isLoading: true, error: null });
    try {
      const res = await payoutApi.adminProcessPayout(id, data);
      if (res.success && res.data) {
        // Update local list
        set((state) => ({
          adminPayouts: state.adminPayouts.map((p) => p.id === id ? res.data! : p)
        }));
      }
    } catch (err: unknown) {
      const errorRes = err as AxiosErrorResponse;
      set({ error: errorRes.response?.data?.message || "Không thể xử lý giải ngân" });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  }
}));
