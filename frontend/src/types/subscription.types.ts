export interface SubscriptionPlan {
  id: number;
  name: 'FREE' | 'SELLER_PRO_MONTHLY' | 'SELLER_PRO_YEARLY';
  displayName: string;
  price: number;
  durationDays: number;
  maxListings: number;
  maxImages: number;
  boostCredits: number;
  analyticsLevel: 'BASIC' | 'ADVANCED';
}

export interface UserSubscription {
  id: number;
  userId: number;
  plan: SubscriptionPlan;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  startedAt: string;
  expiresAt: string | null;
  autoRenew: boolean;
  paymentRef: string | null;
}

export interface UserSubscriptionResponse {
  subscription: UserSubscription | null;
  activeListingCount: number;
  limitReached: boolean;
}
