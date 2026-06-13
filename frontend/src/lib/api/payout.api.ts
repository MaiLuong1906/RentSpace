import apiClient from "./axios";
import { ApiResponse, PageResponse } from "@/types/api.types";
import { 
  LandlordPayoutAccount, 
  PayoutTransaction, 
  PayoutAccountRequest, 
  ProcessPayoutRequest,
  PayoutStatus
} from "@/types/payout.types";

// Note: PageResponse is commonly defined as a wrapper for Spring Page. Let's make sure it works.
// We can also define page responses inline as needed, or check api.types.ts

export const payoutApi = {
  // Landlord: Liên kết tài khoản ngân hàng
  linkPayoutAccount: async (data: PayoutAccountRequest) => {
    const response = await apiClient.put<ApiResponse<LandlordPayoutAccount>>("/landlord/payout-account", data);
    return response.data;
  },

  // Landlord: Lấy thông tin tài khoản ngân hàng liên kết
  getPayoutAccount: async () => {
    const response = await apiClient.get<ApiResponse<LandlordPayoutAccount>>("/landlord/payout-account");
    return response.data;
  },

  // Landlord: Lấy lịch sử giải ngân của mình
  getPayoutHistory: async (page = 0, size = 10) => {
    const response = await apiClient.get<ApiResponse<PageResponse<PayoutTransaction>>>(
      `/landlord/payouts?page=${page}&size=${size}`
    );
    return response.data;
  },

  // ADMIN: Xem các yêu cầu giải ngân theo trạng thái
  adminGetPayouts: async (status: PayoutStatus = 'PENDING', page = 0, size = 10) => {
    const response = await apiClient.get<ApiResponse<PageResponse<PayoutTransaction>>>(
      `/admin/payouts?status=${status}&page=${page}&size=${size}`
    );
    return response.data;
  },

  // ADMIN: Xử lý phê duyệt hoặc từ chối yêu cầu giải ngân
  adminProcessPayout: async (id: number, data: ProcessPayoutRequest) => {
    const response = await apiClient.post<ApiResponse<PayoutTransaction>>(`/admin/payouts/${id}/process`, data);
    return response.data;
  }
};
