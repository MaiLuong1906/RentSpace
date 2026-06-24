"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api/analytics.api";

export function useLandlordAnalytics() {
  return useQuery({
    queryKey: ["landlord-analytics"],
    queryFn: () => analyticsApi.getLandlordAnalytics(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useLandlordFunnel(from: string, to: string) {
  return useQuery({
    queryKey: ["landlord-funnel", from, to],
    queryFn: () => analyticsApi.getFunnel(from, to),
    staleTime: 1000 * 60 * 5,
    enabled: Boolean(from && to),
  });
}

export function useLandlordRevenue(year: number) {
  return useQuery({
    queryKey: ["landlord-revenue", year],
    queryFn: () => analyticsApi.getMonthlyRevenue(year),
    staleTime: 1000 * 60 * 5,
  });
}

export function useAdminSummary(from: string, to: string) {
  return useQuery({
    queryKey: ["admin-summary", from, to],
    queryFn: () => analyticsApi.getAdminSummary(from, to),
    staleTime: 1000 * 60 * 5,
    enabled: Boolean(from && to),
  });
}

export function useTopLandlords(from: string, to: string, limit: number = 10) {
  return useQuery({
    queryKey: ["top-landlords", from, to, limit],
    queryFn: () => analyticsApi.getTopLandlords(from, to, limit),
    staleTime: 1000 * 60 * 5,
    enabled: Boolean(from && to),
  });
}
