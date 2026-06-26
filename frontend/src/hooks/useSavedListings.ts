"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { interactionApi } from "@/lib/api/interaction.api";
import type { SavedListingsParams } from "@/types/interaction.types";

// ===== Query Keys =====
export const savedListingsKeys = {
  all: ["saved-listings"] as const,
  list: (params?: SavedListingsParams) =>
    ["saved-listings", "list", params] as const,
  status: (listingId: number) =>
    ["saved-listings", "status", listingId] as const,
};

// ===== Hooks =====

/**
 * Lấy danh sách tin đã lưu của user (wishlist).
 */
export function useSavedListings(params?: SavedListingsParams) {
  return useQuery({
    queryKey: savedListingsKeys.list(params),
    queryFn: () => interactionApi.getSavedListings(params),
    staleTime: 1000 * 60 * 2, // 2 phút
  });
}

/**
 * Toggle save/unsave một listing với optimistic update.
 * Trả về { isSaved, totalSaves } sau khi toggle.
 */
export function useToggleSave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (listingId: number) => interactionApi.toggleSave(listingId),
    onSuccess: (response, listingId) => {
      // Invalidate saved list và status của listing này
      queryClient.invalidateQueries({ queryKey: savedListingsKeys.all });
      queryClient.invalidateQueries({
        queryKey: savedListingsKeys.status(listingId),
      });
    },
    onError: () => {
      toast.error("Không thể cập nhật danh sách yêu thích. Vui lòng thử lại.");
    },
  });
}
