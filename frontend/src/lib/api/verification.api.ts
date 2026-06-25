import apiClient from "./axios";
import { ApiResponse } from "@/types/api.types";
import {
  VerificationInitResponse,
  VerificationResult,
  VerificationStatusDto,
} from "@/types/verification.types";

export const verificationApi = {
  /** Bước 1-2: Upload ảnh CCCD 2 mặt, nhận faceToken để dùng ở bước 3 */
  submitIdCard: async (
    front: File,
    back: File
  ): Promise<ApiResponse<VerificationInitResponse>> => {
    const form = new FormData();
    form.append("front", front);
    form.append("back", back);
    const res = await apiClient.post<ApiResponse<VerificationInitResponse>>(
      "/verification/submit-id",
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data;
  },

  /** Bước 3: Upload selfie + faceToken, nhận kết quả xác minh */
  submitSelfie: async (
    selfie: File,
    faceToken: string
  ): Promise<ApiResponse<VerificationResult>> => {
    const form = new FormData();
    form.append("selfie", selfie);
    form.append("faceToken", faceToken);
    const res = await apiClient.post<ApiResponse<VerificationResult>>(
      "/verification/submit-face",
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data;
  },

  /** Xem trạng thái xác minh của bản thân */
  getStatus: async (): Promise<ApiResponse<VerificationStatusDto>> => {
    const res =
      await apiClient.get<ApiResponse<VerificationStatusDto>>(
        "/verification/status"
      );
    return res.data;
  },
};
