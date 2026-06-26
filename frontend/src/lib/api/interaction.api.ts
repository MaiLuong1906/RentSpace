import apiClient from "./axios";
import type {
  InteractionTrackRequest,
  SaveToggleResponse,
  SavedListingsParams,
} from "@/types/interaction.types";
import type { ApiResponse, PageResponse } from "@/types/api.types";
import type { Listing } from "@/types/listing.types";

export const interactionApi = {
  // POST /api/v1/interactions/track — public, JWT optional
  track: (data: InteractionTrackRequest) =>
    apiClient
      .post<ApiResponse<null>>("/interactions/track", data, { timeout: 5000 })
      .then((res) => res.data),

  // POST /api/v1/saved-listings/{listingId} — toggle save/unsave
  toggleSave: (listingId: number) =>
    apiClient
      .post<ApiResponse<SaveToggleResponse>>(`/saved-listings/${listingId}`)
      .then((res) => res.data),

  // GET /api/v1/saved-listings — wishlist của user
  getSavedListings: (params?: SavedListingsParams) =>
    apiClient
      .get<ApiResponse<PageResponse<Listing>>>("/saved-listings", { params })
      .then((res) => res.data),

  // GET /api/v1/saved-listings/{listingId}/status — check trạng thái đã lưu
  checkSavedStatus: (listingId: number) =>
    apiClient
      .get<ApiResponse<boolean>>(`/saved-listings/${listingId}/status`)
      .then((res) => res.data),
};
