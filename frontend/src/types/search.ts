import type { Listing } from "@/types/listing.types"

export interface ExtractedParams {
  city: string | null
  district: string | null
  minPrice: number | null
  maxPrice: number | null
  minArea: number | null
  roomType: "PHONG_TRO" | "CHUNG_CU_MINI" | "CHUNG_CU" | "NGAN_GIAN" | "NHA_NGUYEN_CAN" | null
  hasWifi: boolean | null
  hasAirConditioner: boolean | null
  hasParking: boolean | null
  hasWashingMachine: boolean | null
  keywords: string | null
}

export interface SemanticSearchResult {
  extractedParams: ExtractedParams
  listings: Listing[]
  totalElements: number
  usedFallback: boolean
}

export interface AssistantSearchResult {
  message: string
  extractedParams: ExtractedParams | null
  listings: Listing[]
  totalElements: number
  usedFallback: boolean
}
