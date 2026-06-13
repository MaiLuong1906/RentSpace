export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface LandlordPayoutAccount {
  id: number;
  bankName: string;
  bankCode: string;
  accountNumber: string; // Masked: ******5678
  accountName: string;
  isVerified: boolean;
  verifiedAt?: string;
  createdAt: string;
}

export interface PayoutTransaction {
  id: number;
  landlordId: number;
  landlordName: string;
  bankName: string;
  bankCode: string;
  accountNumber: string; // Masked
  accountName: string;
  depositId: number;
  listingTitle: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: PayoutStatus;
  bankRef?: string;
  processedAt?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayoutAccountRequest {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

export interface ProcessPayoutRequest {
  status: PayoutStatus;
  bankRef?: string;
  note?: string;
}
