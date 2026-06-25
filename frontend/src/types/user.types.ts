export interface User {
  id: number;
  email: string;
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  role: "TENANT" | "LANDLORD" | "ADMIN";
  kycStatus: "PENDING" | "SUBMITTED" | "VERIFIED" | "REJECTED";
  isEmailVerified: boolean;
  createdAt: string;
  /** Phase 4: xác minh danh tính qua FPT.AI eKYC */
  isVerified?: boolean;
  verificationStatus?: "NOT_STARTED" | "PENDING" | "PROCESSING" | "VERIFIED" | "REJECTED";
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
  role: "TENANT" | "LANDLORD";
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
