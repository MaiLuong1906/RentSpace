export interface Listing {
  id: number;
  landlordId: number;
  landlordName: string;
  landlordAvatarUrl?: string;
  title: string;
  description?: string;
  price: number;
  deposit?: number;
  area?: number;
  address: string;
  district?: string;
  city: string;
  latitude?: number;
  longitude?: number;
  roomType: RoomType;
  status: ListingStatus;
  amenities: string[];
  imageUrls: string[];
  averageRating: number;
  reviewCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export type RoomType =
  | "PHONG_TRO"
  | "CHUNG_CU_MINI"
  | "CHUNG_CU"
  | "NGAN_GIAN"
  | "NHA_NGUYEN_CAN";

export type ListingStatus =
  | "PENDING"
  | "ACTIVE"
  | "RENTED"
  | "HIDDEN"
  | "REJECTED";

export interface ListingSearchParams {
  city?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  roomType?: RoomType;
  amenities?: string[];
  lat?: number;
  lng?: number;
  radius?: number;   // km
  page?: number;
  size?: number;
  sort?: string;
}
