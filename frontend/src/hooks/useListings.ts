"use client";

import { useQuery } from "@tanstack/react-query";
import { listingApi } from "@/lib/api/listing.api";
import type { ListingSearchParams } from "@/types/listing.types";

export function useListings(params: ListingSearchParams) {
  return useQuery({
    queryKey: ["listings", params],
    queryFn: () => listingApi.getListings(params),
    staleTime: 1000 * 60 * 5, // 5 phút
  });
}

export function useListing(id: string) {
  return useQuery({
    queryKey: ["listing", id],
    queryFn: () => listingApi.getListingById(id),
    enabled: !!id,
  });
}

export function useMyListings() {
  return useQuery({
    queryKey: ["my-listings"],
    queryFn: () => listingApi.getMyListings(),
  });
}
