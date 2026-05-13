// Mock data for development and demo purposes
// In production, replace with actual API calls

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  address: string;
  district: string;
  city: string;
  lat: number;
  lng: number;
  area: number;
  roomType: "single" | "shared" | "apartment" | "studio";
  images: string[];
  amenities: string[];
  landlordId: string;
  landlordName: string;
  landlordAvatar: string;
  landlordVerified: boolean;
  status: "available" | "rented" | "pending";
  createdAt: string;
  rating: number;
  reviewCount: number;
}

export interface Review {
  id: string;
  listingId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  createdAt: string;
  images?: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: "tenant" | "landlord" | "admin";
  verified: boolean;
  kycStatus: "pending" | "approved" | "rejected" | "not_submitted";
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage: Message;
  unreadCount: number;
}

// Mock listings data
export const mockListings: Listing[] = [
  {
    id: "1",
    title: "Phòng trọ tiện nghi gần Đại học Bách Khoa",
    description: "Phòng trọ sạch sẽ, đầy đủ tiện nghi, an ninh 24/7. Gần trường học, siêu thị, quán ăn. Giá điện nước theo đồng hồ.",
    price: 3500000,
    address: "123 Đường Lê Duẩn",
    district: "Hải Châu",
    city: "Đà Nẵng",
    lat: 16.0544,
    lng: 108.2022,
    area: 25,
    roomType: "single",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop",
    ],
    amenities: ["WiFi", "Điều hòa", "Nóng lạnh", "Giường", "Tủ quần áo", "Ban công"],
    landlordId: "landlord1",
    landlordName: "Chị Mai Hương",
    landlordAvatar: "https://i.pravatar.cc/150?img=1",
    landlordVerified: true,
    status: "available",
    createdAt: "2026-05-01T10:00:00Z",
    rating: 4.8,
    reviewCount: 12,
  },
  {
    id: "2",
    title: "Chung cư mini cao cấp Sơn Trà",
    description: "Căn hộ studio hiện đại, full nội thất cao cấp. View biển tuyệt đẹp, khu an ninh tốt.",
    price: 5500000,
    address: "456 Võ Nguyên Giáp",
    district: "Sơn Trà",
    city: "Đà Nẵng",
    lat: 16.0563,
    lng: 108.2441,
    area: 35,
    roomType: "studio",
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=600&fit=crop",
    ],
    amenities: ["WiFi", "Điều hòa", "Máy giặt", "Tủ lạnh", "Bếp", "Thang máy", "Bảo vệ 24/7"],
    landlordId: "landlord2",
    landlordName: "Anh Tuấn Anh",
    landlordAvatar: "https://i.pravatar.cc/150?img=12",
    landlordVerified: true,
    status: "available",
    createdAt: "2026-05-05T14:30:00Z",
    rating: 4.9,
    reviewCount: 8,
  },
  {
    id: "3",
    title: "Phòng ở ghép cho sinh viên nữ",
    description: "Phòng 2 người, sạch sẽ, thoáng mát. Chủ nhà thân thiện, gần KTX, bến xe.",
    price: 2000000,
    address: "789 Nguyễn Lương Bằng",
    district: "Liên Chiểu",
    city: "Đà Nẵng",
    lat: 16.0621,
    lng: 108.1503,
    area: 20,
    roomType: "shared",
    images: [
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&h=600&fit=crop",
    ],
    amenities: ["WiFi", "Điều hòa", "Giường", "Tủ đồ riêng"],
    landlordId: "landlord1",
    landlordName: "Chị Mai Hương",
    landlordAvatar: "https://i.pravatar.cc/150?img=1",
    landlordVerified: true,
    status: "available",
    createdAt: "2026-04-28T09:15:00Z",
    rating: 4.5,
    reviewCount: 15,
  },
  {
    id: "4",
    title: "Căn hộ 1 phòng ngủ Thanh Khê",
    description: "Căn hộ đầy đủ nội thất, khu dân cư yên tĩnh, an ninh. Gần chợ, trường học.",
    price: 4200000,
    address: "234 Ông Ích Khiêm",
    district: "Thanh Khê",
    city: "Đà Nẵng",
    lat: 16.0752,
    lng: 108.1933,
    area: 30,
    roomType: "apartment",
    images: [
      "https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=800&h=600&fit=crop",
    ],
    amenities: ["WiFi", "Điều hòa", "Máy giặt", "Tủ lạnh", "Bếp", "Nóng lạnh"],
    landlordId: "landlord3",
    landlordName: "Cô Phương",
    landlordAvatar: "https://i.pravatar.cc/150?img=5",
    landlordVerified: false,
    status: "available",
    createdAt: "2026-05-10T11:20:00Z",
    rating: 4.6,
    reviewCount: 6,
  },
  {
    id: "5",
    title: "Phòng trọ cao cấp view sông Hàn",
    description: "Phòng rộng rãi, view đẹp, full nội thất. Khu vực an ninh, yên tĩnh.",
    price: 4800000,
    address: "567 Bạch Đằng",
    district: "Hải Châu",
    city: "Đà Nẵng",
    lat: 16.0678,
    lng: 108.2233,
    area: 28,
    roomType: "single",
    images: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1501183638710-841dd1904471?w=800&h=600&fit=crop",
    ],
    amenities: ["WiFi", "Điều hòa", "Tủ lạnh", "Giường", "Tủ quần áo", "Ban công"],
    landlordId: "landlord2",
    landlordName: "Anh Tuấn Anh",
    landlordAvatar: "https://i.pravatar.cc/150?img=12",
    landlordVerified: true,
    status: "available",
    createdAt: "2026-05-08T16:45:00Z",
    rating: 4.7,
    reviewCount: 10,
  },
  {
    id: "6",
    title: "Phòng ở ghép nam gần TTTP",
    description: "Phòng 3 người, tiện nghi đầy đủ. Khu vực sầm uất, gần trung tâm.",
    price: 1800000,
    address: "890 Trần Phú",
    district: "Hải Châu",
    city: "Đà Nẵng",
    lat: 16.0471,
    lng: 108.2068,
    area: 24,
    roomType: "shared",
    images: [
      "https://images.unsplash.com/photo-1486304873000-235643847519?w=800&h=600&fit=crop",
    ],
    amenities: ["WiFi", "Điều hòa", "Giường", "Tủ đồ riêng", "Nóng lạnh"],
    landlordId: "landlord3",
    landlordName: "Cô Phương",
    landlordAvatar: "https://i.pravatar.cc/150?img=5",
    landlordVerified: false,
    status: "available",
    createdAt: "2026-05-03T13:30:00Z",
    rating: 4.3,
    reviewCount: 9,
  },
];

// Mock reviews data
export const mockReviews: Review[] = [
  {
    id: "r1",
    listingId: "1",
    userId: "user1",
    userName: "Nguyễn Văn A",
    userAvatar: "https://i.pravatar.cc/150?img=8",
    rating: 5,
    comment: "Phòng rất đẹp, chủ nhà thân thiện. Khu vực an ninh tốt, gần trường học tiện đi lại.",
    createdAt: "2026-04-15T10:30:00Z",
  },
  {
    id: "r2",
    listingId: "1",
    userId: "user2",
    userName: "Trần Thị B",
    userAvatar: "https://i.pravatar.cc/150?img=9",
    rating: 4,
    comment: "Phòng ok, giá hợp lý. Điện nước đúng giá, chủ nhà dễ tính.",
    createdAt: "2026-03-20T14:15:00Z",
  },
  {
    id: "r3",
    listingId: "2",
    userId: "user3",
    userName: "Lê Minh C",
    userAvatar: "https://i.pravatar.cc/150?img=10",
    rating: 5,
    comment: "Căn hộ tuyệt vời! View biển đẹp, nội thất hiện đại. Rất đáng giá với mức giá này.",
    createdAt: "2026-04-25T09:00:00Z",
  },
];

// Mock current user
export const mockCurrentUser: User = {
  id: "current-user",
  name: "Nguyễn Văn Nam",
  email: "nam.nguyen@example.com",
  phone: "0901234567",
  avatar: "https://i.pravatar.cc/150?img=13",
  role: "tenant",
  verified: true,
  kycStatus: "approved",
  createdAt: "2026-01-15T10:00:00Z",
};

// Helper functions
export const getListingById = (id: string): Listing | undefined => {
  return mockListings.find((listing) => listing.id === id);
};

export const getReviewsByListingId = (listingId: string): Review[] => {
  return mockReviews.filter((review) => review.listingId === listingId);
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

export const getRoomTypeLabel = (roomType: string): string => {
  const labels: Record<string, string> = {
    single: "Phòng đơn",
    shared: "Phòng ở ghép",
    apartment: "Căn hộ",
    studio: "Studio",
  };
  return labels[roomType] || roomType;
};
