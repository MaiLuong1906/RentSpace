import apiClient from "./axios";
import { ApiResponse } from "@/types/api.types";

export const depositApi = {
  // Tạo giao dịch đặt cọc
  createDeposit: async (listingId: number, amount: number, moveInDate: string) => {
    const response = await apiClient.post<ApiResponse<any>>("/deposits", {
      listingId,
      amount,
      moveInDate,
    });
    return response.data;
  },

  // Lấy chi tiết giao dịch
  getDepositById: async (id: number) => {
    const response = await apiClient.get<ApiResponse<any>>(`/deposits/${id}`);
    return response.data;
  },

  // Lấy lịch sử giao dịch
  getDeposits: async () => {
    const response = await apiClient.get<ApiResponse<any[]>>("/deposits");
    return response.data;
  },

  // Khởi tạo thanh toán VNPay
  initiatePayment: async (id: number) => {
    const response = await apiClient.post<ApiResponse<{ paymentUrl: string }>>(`/deposits/${id}/initiate-payment`);
    return response.data;
  },

  // Người thuê xác nhận đã nhận phòng
  confirmMoveIn: async (id: number) => {
    const response = await apiClient.patch<ApiResponse<any>>(`/deposits/${id}/confirm-move-in`);
    return response.data;
  },

  // Mở tranh chấp
  openDispute: async (id: number, data: { reason: string; description: string; evidenceUrls: string[] }) => {
    const response = await apiClient.patch<ApiResponse<any>>(`/deposits/${id}/dispute`, data);
    return response.data;
  },
};
