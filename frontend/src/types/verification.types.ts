export type VerificationStatus =
  | "NOT_STARTED"
  | "PENDING"
  | "PROCESSING"
  | "VERIFIED"
  | "REJECTED";

export interface VerificationStatusDto {
  status: VerificationStatus;
  maskedId?: string;
  fullName?: string;
  verifiedAt?: string;
  rejectionReason?: string;
}

export interface VerificationInitResponse {
  faceToken: string;
  maskedId: string;
  fullName: string;
}

export interface VerificationResult {
  status: VerificationStatus;
  message: string;
}
