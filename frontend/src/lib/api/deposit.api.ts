import apiClient from "./axios";
import { ApiResponse } from "@/types/api.types";
import { DepositTransaction, DisputeResponse } from "@/types/phase2.types";

export const depositApi = {
  // Tạo giao dịch đặt cọc
  createDeposit: async (listingId: number, amount: number, moveInDate: string, notes?: string) => {
    const response = await apiClient.post<ApiResponse<DepositTransaction>>("/deposits", {
      listingId,
      amount,
      moveInDate,
      notes,
    });
    return response.data;
  },

  // Lấy chi tiết giao dịch
  getDepositById: async (id: number) => {
    const response = await apiClient.get<ApiResponse<DepositTransaction>>(`/deposits/${id}`);
    return response.data;
  },

  // Lấy lịch sử giao dịch
  getDeposits: async () => {
    const response = await apiClient.get<ApiResponse<DepositTransaction[]>>("/deposits");
    return response.data;
  },

  // Khởi tạo thanh toán VNPay
  initiatePayment: async (id: number) => {
    const response = await apiClient.post<ApiResponse<{ paymentUrl: string }>>(`/deposits/${id}/initiate-payment`);
    return response.data;
  },

  // Người thuê xác nhận đã nhận phòng
  confirmMoveIn: async (id: number) => {
    const response = await apiClient.patch<ApiResponse<DepositTransaction>>(`/deposits/${id}/confirm-move-in`);
    return response.data;
  },

  // Mở tranh chấp
  openDispute: async (id: number, data: { reason: string; description: string; evidenceUrls: string[] }) => {
    const response = await apiClient.patch<ApiResponse<DepositTransaction>>(`/deposits/${id}/dispute`, data);
    return response.data;
  },

  // ADMIN: Lấy danh sách tất cả tranh chấp đặt cọc
  adminGetAllDisputes: async () => {
    const response = await apiClient.get<ApiResponse<DisputeResponse[]>>("/admin/disputes");
    return response.data;
  },

  // ADMIN: Phán quyết tranh chấp
  adminResolveDispute: async (id: number, resolution: 'RESOLVED_TENANT' | 'RESOLVED_LANDLORD' | 'RESOLVED_PLATFORM', resolutionNote: string) => {
    const response = await apiClient.patch<ApiResponse<DepositTransaction>>(`/admin/disputes/${id}/resolve`, {
      resolution,
      resolutionNote
    });
    return response.data;
  },
};
