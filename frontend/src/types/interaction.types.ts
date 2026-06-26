// ============================================================
// Types đồng bộ với Interaction domain (Phase 4 Sprint 4)
// ============================================================

export type InteractionType =
  | "VIEW"
  | "SAVE"
  | "UNSAVE"
  | "CHAT_INIT"
  | "DEPOSIT"
  | "SHARE";

export type InteractionReferrer =
  | "SEARCH"
  | "RECOMMENDATION"
  | "DIRECT"
  | "SEO";

// Request gửi lên POST /api/v1/interactions/track
export interface InteractionTrackRequest {
  listingId: number;
  type: InteractionType;
  viewDurationSec?: number;
  referrer?: string;
  sessionId: string;
}

// Response từ POST /api/v1/saved-listings/{listingId}
export interface SaveToggleResponse {
  isSaved: boolean;
  totalSaves: number;
}

// Params phân trang cho GET /api/v1/saved-listings
export interface SavedListingsParams {
  page?: number;
  size?: number;
}
