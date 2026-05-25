import { ApiResponse } from "./api.types";

export type KycStatus = "PENDING" | "SUBMITTED" | "VERIFIED" | "REJECTED";

export interface KycStatusResponse {
  status: KycStatus;
  cccdImageUrl: string | null;
}

export interface KycReviewItem {
  userId: number;
  email: string;
  fullName: string;
  kycStatus: KycStatus;
  cccdImageUrl: string;
  submittedAt: string;
}

export type KycSubmitResponse = ApiResponse<string>;
export type KycStatusApiResponse = ApiResponse<KycStatusResponse>;
export type KycListApiResponse = ApiResponse<KycReviewItem[]>;
