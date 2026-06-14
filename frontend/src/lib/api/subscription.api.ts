import apiClient from "./axios";
import { SubscriptionPlan, UserSubscriptionResponse } from "@/types/subscription.types";
import { ApiResponse } from "@/types/api.types";

export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  const response = await apiClient.get<ApiResponse<SubscriptionPlan[]>>("/subscriptions/plans");
  return response.data.data;
};

export const getCurrentSubscription = async (): Promise<UserSubscriptionResponse> => {
  const response = await apiClient.get<ApiResponse<UserSubscriptionResponse>>("/landlord/subscriptions/current");
  return response.data.data;
};

export interface SubscribeRequest {
  planId: number;
}

export interface PaymentResponse {
  paymentUrl: string;
}

export const subscribePlan = async (
  planId: number,
  method: "VNPAY" | "MOMO"
): Promise<PaymentResponse> => {
  const response = await apiClient.post<ApiResponse<PaymentResponse>>(
    `/landlord/subscriptions/subscribe?method=${method}`,
    { planId }
  );
  return response.data.data;
};
