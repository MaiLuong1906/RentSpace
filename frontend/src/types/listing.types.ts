// ============================================================
// Types được đồng bộ với Backend DTOs
// Cập nhật: 2026-05-30 — Khớp với ListingResponse.java
// ============================================================

// --- Ảnh của tin đăng (khớp ListingImageResponse.java) ---
export interface ListingImage {
  id: number;
  imageUrl: string;
  displayOrder: number;
}

// --- Trạng thái tin đăng (khớp ListingStatus.java enum) ---
export type ListingStatus =
  | "DRAFT"     // Bản nháp, chưa đăng
  | "PENDING"   // Chờ duyệt
  | "ACTIVE"    // Đang cho thuê, hiển thị công khai
  | "REJECTED"  // Bị từ chối duyệt
  | "RENTED"    // Đã có người thuê
  | "INACTIVE"  // Chủ trọ tạm ẩn tin
  | "DELETED";  // Soft delete

// --- Response từ backend (khớp ListingResponse.java) ---
export interface Listing {
  id: number;
  landlordId: number;
  landlordName: string;
  landlordAvatar?: string;

  title: string;
  description?: string;

  address: string;
  ward?: string;
  district?: string;
  city: string;
  latitude?: number;
  longitude?: number;

  pricePerMonth: number;
  areaM2?: number;
  numBedrooms?: number;
  numBathrooms?: number;

  hasWifi?: boolean;
  hasParking?: boolean;
  hasAirConditioner?: boolean;
  hasWashingMachine?: boolean;
  allowPets?: boolean;

  status: ListingStatus;
  images: ListingImage[];

  averageRating?: number;
  reviewCount?: number;

  createdAt: string;
  updatedAt: string;
}

// --- Request tạo / cập nhật tin đăng (khớp CreateListingRequest.java) ---
export interface CreateListingRequest {
  title: string;                // @NotBlank, 10–200 ký tự
  description?: string;         // max 5000 ký tự
  address: string;              // @NotBlank
  ward?: string;
  district?: string;
  city?: string;
  latitude?: number;            // -90 đến 90
  longitude?: number;           // -180 đến 180
  pricePerMonth: number;        // @NotNull, > 0
  areaM2?: number;              // > 0
  numBedrooms?: number;         // >= 0
  numBathrooms?: number;        // >= 0
  hasWifi?: boolean;
  hasParking?: boolean;
  hasAirConditioner?: boolean;
  hasWashingMachine?: boolean;
  allowPets?: boolean;
}

// --- Request đổi trạng thái (khớp UpdateListingStatusRequest.java) ---
export interface UpdateListingStatusRequest {
  status: ListingStatus;
}

// --- Params tìm kiếm (khớp ListingController query params) ---
export interface ListingSearchParams {
  city?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  page?: number;
  size?: number;
  sort?: string;
  status?: ListingStatus;
}

// --- Params tìm kiếm theo tọa độ (khớp GET /listings/nearby) ---
export interface NearbySearchParams {
  lat: number;
  lng: number;
  radius?: number;  // km, default 5.0, no max
  limit?: number;   // default 20, max 50
}

