"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api/analytics.api";

export function useLandlordAnalytics() {
  return useQuery({
    queryKey: ["landlord-analytics"],
    queryFn: () => analyticsApi.getLandlordAnalytics(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
