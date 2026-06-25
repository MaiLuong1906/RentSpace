import apiClient from "./axios";
import { ApiResponse } from "@/types/api.types";

export type ContractStatus =
  | "DRAFT"
  | "PENDING_SIGNATURES"
  | "FULLY_SIGNED"
  | "CANCELLED"
  | "EXPIRED";

export interface ContractDetail {
  id: number;
  depositId: number;
  landlordId: number;
  landlordName: string;
  tenantId: number;
  tenantName: string;
  contentSnapshot: string;
  status: ContractStatus;
  landlordSignedAt?: string;
  tenantSignedAt?: string;
  expiresAt?: string;
  pdfUrl?: string;
  cancellationReason?: string;
  createdAt: string;
}

export interface PagedContracts {
  content: ContractDetail[];
  page: { totalElements: number; totalPages: number; number: number };
}

export const contractApi = {
  getContract: (id: number): Promise<ApiResponse<ContractDetail>> =>
    apiClient.get(`/contracts/${id}`).then((r) => r.data),

  sign: (id: number): Promise<ApiResponse<ContractDetail>> =>
    apiClient.post(`/contracts/${id}/sign`).then((r) => r.data),

  downloadPdfUrl: (id: number): string =>
    `/api/v1/contracts/${id}/pdf`,

  getMyContracts: (
    status?: ContractStatus,
    page = 0,
    size = 10
  ): Promise<ApiResponse<PagedContracts>> =>
    apiClient
      .get("/contracts/mine", { params: { status, page, size, sort: "createdAt,desc" } })
      .then((r) => r.data),
};
