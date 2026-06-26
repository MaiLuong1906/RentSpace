import apiClient from "./axios";
import { ApiResponse } from "@/types/api.types";
import { AxiosResponse } from "axios";

export interface ContractAiResponse {
  answer: string;
  tokensUsed: number;
  questionsToday: number;
  dailyLimit: number;
}

export interface AiQuotaResponse {
  used: number;
  limit: number;
  resetsAt: string;
}

export const contractAiApi = {
  ask: (contractId: number, question: string) =>
    apiClient
      .post<ApiResponse<ContractAiResponse>>(`/contracts/${contractId}/ai/ask`, { question })
      .then((res: AxiosResponse<ApiResponse<ContractAiResponse>>) => res.data),

  getQuota: (contractId: number) =>
    apiClient
      .get<ApiResponse<AiQuotaResponse>>(`/contracts/${contractId}/ai/quota`)
      .then((res: AxiosResponse<ApiResponse<AiQuotaResponse>>) => res.data),
};
