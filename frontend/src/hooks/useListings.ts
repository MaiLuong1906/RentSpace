"use client";

import { useQuery } from "@tanstack/react-query";
import { listingApi } from "@/lib/api/listing.api";
import type { ListingSearchParams, NearbySearchParams } from "@/types/listing.types";

export function useListings(params: ListingSearchParams) {
  return useQuery({
    queryKey: ["listings", params],
    queryFn: () => listingApi.getListings(params),
    staleTime: 1000 * 60 * 5, // 5 phút
  });
}

export function useListing(id: string | number) {
  return useQuery({
    queryKey: ["listing", id],
    queryFn: () => listingApi.getListingById(id),
    enabled: !!id,
  });
}

export function useMyListings(params?: Pick<ListingSearchParams, "page" | "size" | "sort" | "status">) {
  return useQuery({
    queryKey: ["my-listings", params],
    queryFn: () => listingApi.getMyListings(params),
  });
}

export function useNearbyListings(params: NearbySearchParams) {
  return useQuery({
    queryKey: ["listings-nearby", params],
    queryFn: () => listingApi.findNearby(params),
    enabled: typeof params.lat === "number" && typeof params.lng === "number",
    staleTime: 1000 * 60 * 2, // 2 phút
  });
}

