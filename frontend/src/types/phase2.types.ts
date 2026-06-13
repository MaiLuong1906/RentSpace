export interface DepositTransaction {
  id: number;
  listingId: number;
  listingTitle?: string;
  tenantId: number;
  tenantName?: string;
  landlordId: number;
  landlordName?: string;
  amount: number;
  platformFee: number;
  netAmount: number;
  status: 'PENDING_PAYMENT' | 'PAID' | 'DISPUTED' | 'RELEASED' | 'REFUNDED' | 'CANCELLED';
  paymentMethod?: 'VNPAY' | 'MOMO';
  paymentGatewayRef?: string;
  paymentUrl?: string;
  paymentMethodDetail?: Record<string, unknown>;
  paidAt?: string;
  releasedAt?: string;
  refundedAt?: string;
  releaseDeadline?: string;
  moveInDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  contractUrl?: string;
}

export interface PostAuthor {
  id: number;
  name: string;
  avatarUrl?: string;
  kycStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
}

export interface Post {
  id: number;
  author: PostAuthor;
  type: 'ROOMMATE' | 'TIPS' | 'REVIEW' | 'QUESTION';
  content: string;
  imageUrls?: string[];
  relatedListingId?: number;
  district?: string;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommentAuthor {
  id: number;
  name: string;
  avatarUrl?: string;
}

export interface PostComment {
  id: number;
  postId: number;
  author: CommentAuthor;
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

export interface DisputeResponse {
  id: number;
  transactionId: number;
  openedById: number;
  openedByName?: string;
  reason: 'ROOM_NOT_AS_DESCRIBED' | 'LANDLORD_NO_SHOW' | 'TENANT_NO_SHOW' | 'OTHER';
  description: string;
  evidenceUrls: string[];
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED_TENANT' | 'RESOLVED_LANDLORD' | 'RESOLVED_PLATFORM';
  resolutionNote?: string;
  resolvedById?: number;
  resolvedByName?: string;
  resolvedAt?: string;
  createdAt: string;
}
