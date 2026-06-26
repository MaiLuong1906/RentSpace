"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { recommendationApi } from "@/lib/api/recommendation.api";

const STALE_TIME = 30 * 60 * 1000; // 30 phút — match Redis TTL backend

export function useSimilarListings(listingId: number, limit = 6) {
  return useQuery({
    queryKey: ["recommendations", "similar", listingId, limit],
    queryFn: () => recommendationApi.getSimilar(listingId, limit),
    staleTime: STALE_TIME,
    enabled: !!listingId,
  });
}

export function useForYouRecommendations(limit = 12) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ["recommendations", "for-you", session?.user?.id ?? "anonymous", limit],
    queryFn: () =>
      session
        ? recommendationApi.getForYou(limit)
        : recommendationApi.getTrending(limit),
    staleTime: STALE_TIME,
  });
}

export function useTrendingListings(limit = 12) {
  return useQuery({
    queryKey: ["recommendations", "trending", limit],
    queryFn: () => recommendationApi.getTrending(limit),
    staleTime: 15 * 60 * 1000, // 15 phút — match Redis TTL
  });
}
