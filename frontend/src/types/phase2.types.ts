export interface DepositTransaction {
  id: number;
  listingId: number;
  tenantId: number;
  landlordId: number;
  amount: number;
  platformFee: number;
  netAmount: number;
  status: 'PENDING_PAYMENT' | 'PAID' | 'DISPUTED' | 'RELEASED' | 'REFUNDED' | 'CANCELLED';
  paymentMethod?: string;
  paymentGatewayRef?: string;
  paymentUrl?: string;
  paidAt?: string;
  releasedAt?: string;
  refundedAt?: string;
  releaseDeadline?: string;
  moveInDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: number;
  authorId: number;
  authorName?: string;
  authorAvatar?: string;
  type: 'ROOMMATE' | 'TIPS' | 'REVIEW' | 'QUESTION';
  content: string;
  imageUrls?: string[];
  relatedListing?: number;
  district?: string;
  likeCount: number;
  commentCount: number;
  reportCount: number;
  isHidden: boolean;
  likedByMe?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PostComment {
  id: number;
  postId: number;
  authorId: number;
  authorName?: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
}

export interface RoommateProfile {
  id: number;
  userId: number;
  fullName?: string;
  avatar?: string;
  gender?: string;
  occupation?: string;
  budgetMin?: number;
  budgetMax?: number;
  preferredArea?: string;
  moveInDate?: string;
  lifestyleTags?: string[];
  bio?: string;
  isActive: boolean;
}

export interface RoommateMatch {
  id: number;
  profileA: RoommateProfile;
  profileB: RoommateProfile;
  matchScore: number;
  status: 'SUGGESTED' | 'VIEWED' | 'CONTACTED' | 'DISMISSED';
  createdAt: string;
}

export interface EkycInitResponse {
  sessionId: string;
  sdkToken: string;
}
