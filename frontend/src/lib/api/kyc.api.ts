import apiClient from "./axios";
import {
  KycStatus,
  KycSubmitResponse,
  KycStatusApiResponse,
  KycListApiResponse,
} from "@/types/kyc.types";
import { ApiResponse } from "@/types/api.types";
import { EkycInitResponse } from "@/types/phase2.types";

export const kycApi = {
  /**
   * USER: Nộp hồ sơ KYC (ảnh CCCD)
   * Gửi request dạng multipart/form-data chứa tệp ảnh cccdImage.
   */
  submitKyc: async (cccdImage: File): Promise<KycSubmitResponse> => {
    const formData = new FormData();
    formData.append("cccdImage", cccdImage);

    const response = await apiClient.post<ApiResponse<string>>("/kyc/submit", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * USER: Kiểm tra trạng thái KYC của bản thân
   */
  getKycStatus: async (): Promise<KycStatusApiResponse> => {
    const response = await apiClient.get<KycStatusApiResponse>("/kyc/status");
    return response.data;
  },

  /**
   * ADMIN: Lấy danh sách hồ sơ KYC đang chờ duyệt
   */
  getPendingList: async (): Promise<KycListApiResponse> => {
    const response = await apiClient.get<KycListApiResponse>("/kyc/admin/pending");
    return response.data;
  },

  /**
   * ADMIN: Lấy danh sách hồ sơ KYC theo trạng thái (PENDING/VERIFIED/REJECTED)
   */
  getListByStatus: async (status: KycStatus): Promise<KycListApiResponse> => {
    const response = await apiClient.get<KycListApiResponse>("/kyc/admin/list", {
      params: { status },
    });
    return response.data;
  },

  /**
   * ADMIN: Phê duyệt hồ sơ KYC của người dùng
   */
  approveKyc: async (userId: number): Promise<ApiResponse<string>> => {
    const response = await apiClient.patch<ApiResponse<string>>(`/kyc/admin/${userId}/approve`);
    return response.data;
  },

  /**
   * ADMIN: Từ chối hồ sơ KYC của người dùng kèm theo lý do
   */
  rejectKyc: async (userId: number, reason?: string): Promise<ApiResponse<string>> => {
    const response = await apiClient.patch<ApiResponse<string>>(
      `/kyc/admin/${userId}/reject`,
      null,
      {
        params: { reason: reason || "Không đáp ứng yêu cầu" },
      }
    );
    return response.data;
  },

  /**
   * eKYC: Khởi tạo session eKYC
   */
  initEkyc: async () => {
    const response = await apiClient.post<ApiResponse<EkycInitResponse>>("/kyc/ekyc/init");
    return response.data;
  },

  /**
   * eKYC: Hoàn thành eKYC (gửi kết quả từ SDK về backend)
   */
  completeEkyc: async (data: unknown) => {
    const response = await apiClient.post<ApiResponse<{ status: string; userId: number }>>("/kyc/ekyc/complete", data);
    return response.data;
  },
};
