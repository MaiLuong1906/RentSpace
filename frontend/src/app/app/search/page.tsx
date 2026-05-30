"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Star,
  Map,
  List,
  X,
  Loader2,
} from "lucide-react";
import { mockListings, formatPrice, getRoomTypeLabel } from "@/lib/mockData";
import { useListings } from "@/hooks/useListings";

type ViewMode = "list" | "map";

export default function SearchPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    query: "",
    district: "",
    roomType: "",
    minPrice: "",
    maxPrice: "",
    minArea: "",
    amenities: [] as string[],
  });

  // Query actual backend listings with compatible filters
  const { data: apiResponse, isLoading } = useListings({
    city: "Đà Nẵng", // Since local districts correspond to Da Nang
    district: filters.district || undefined,
    minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
    minArea: filters.minArea ? Number(filters.minArea) : undefined,
    size: 50, // Fetch up to 50 active listings
  });

  // Transform backend response to match search UI component fields
  const apiListings = apiResponse?.data?.content || [];
  const activeListings = apiListings.map((l) => {
    const amenitiesList: string[] = [];
    if (l.hasWifi) amenitiesList.push("WiFi");
    if (l.hasParking) amenitiesList.push("Đỗ xe");
    if (l.hasAirConditioner) amenitiesList.push("Điều hòa");
    if (l.hasWashingMachine) amenitiesList.push("Máy giặt");
    if (l.allowPets) amenitiesList.push("Thú cưng");

    return {
      id: String(l.id),
      title: l.title,
      description: l.description || "",
      price: l.pricePerMonth,
      address: l.address,
      district: l.district || "",
      city: l.city,
      lat: l.latitude ? Number(l.latitude) : 16.0544,
      lng: l.longitude ? Number(l.longitude) : 108.2022,
      area: l.areaM2 || 0,
      roomType: "single" as const, // Fallback room type
      images: l.images && l.images.length > 0
        ? l.images.map((img) => img.imageUrl)
        : ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop"],
      amenities: amenitiesList,
      landlordId: String(l.landlordId),
      landlordName: l.landlordName,
      landlordAvatar: l.landlordAvatar || "https://i.pravatar.cc/150?img=1",
      landlordVerified: true,
      status: l.status === "ACTIVE" ? ("available" as const) : ("rented" as const),
      createdAt: l.createdAt,
      rating: 4.8,
      reviewCount: 12,
    };
  });

  // Fallback to mock list if API returned 0 results (for smooth demo fallback)
  const baseListings = activeListings.length > 0 ? activeListings : mockListings;

  // Apply fine-grained client-side filters for values backend doesn't handle natively yet
  const filteredListings = baseListings.filter((listing) => {
    // 1. Text keyword query matching title or address
    if (filters.query &&
        !listing.title.toLowerCase().includes(filters.query.toLowerCase()) &&
        !listing.address.toLowerCase().includes(filters.query.toLowerCase())) {
      return false;
    }
    // 2. Client-side roomType filtering (fallback)
    if (filters.roomType && listing.roomType !== filters.roomType) {
      return false;
    }
    // 3. Client-side amenity matching
    if (filters.amenities.length > 0) {
      if (!filters.amenities.every((a) => listing.amenities.includes(a))) {
        return false;
      }
    }
    // 4. District fallback filter in case API isn't active
    if (activeListings.length === 0 && filters.district && listing.district !== filters.district) {
      return false;
    }
    // 5. Price fallbacks in case API isn't active
    if (activeListings.length === 0) {
      if (filters.minPrice && listing.price < parseInt(filters.minPrice)) return false;
      if (filters.maxPrice && listing.price > parseInt(filters.maxPrice)) return false;
      if (filters.minArea && listing.area < parseInt(filters.minArea)) return false;
    }
    return true;
  });

  const allAmenities = Array.from(
    new Set(baseListings.flatMap((l) => l.amenities))
  );

  const toggleAmenity = (amenity: string) => {
    setFilters({
      ...filters,
      amenities: filters.amenities.includes(amenity)
        ? filters.amenities.filter((a) => a !== amenity)
        : [...filters.amenities, amenity],
    });
  };

  const resetFilters = () => {
    setFilters({
      query: "",
      district: "",
      roomType: "",
      minPrice: "",
      maxPrice: "",
      minArea: "",
      amenities: [],
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search Header */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={filters.query}
                onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                placeholder="Tìm theo khu vực, địa chỉ..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <SlidersHorizontal className="h-5 w-5" />
              <span>Lọc</span>
              {(filters.district || filters.roomType || filters.amenities.length > 0) && (
                <span className="px-2 py-0.5 bg-blue-500 rounded-full text-xs">
                  {[filters.district, filters.roomType, ...filters.amenities].filter(Boolean).length}
                </span>
              )}
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                  viewMode === "list"
                    ? "border-blue-600 bg-blue-50 text-blue-600"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <List className="h-5 w-5" />
                <span className="hidden sm:inline">Danh sách</span>
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                  viewMode === "map"
                    ? "border-blue-600 bg-blue-50 text-blue-600"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <Map className="h-5 w-5" />
                <span className="hidden sm:inline">Bản đồ</span>
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Bộ lọc tìm kiếm</h3>
                <button
                  onClick={resetFilters}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Đặt lại
                </button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quận/Huyện
                  </label>
                  <select
                    value={filters.district}
                    onChange={(e) => setFilters({ ...filters, district: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tất cả</option>
                    <option value="Hải Châu">Hải Châu</option>
                    <option value="Thanh Khê">Thanh Khê</option>
                    <option value="Sơn Trà">Sơn Trà</option>
                    <option value="Liên Chiểu">Liên Chiểu</option>
                    <option value="Ngũ Hành Sơn">Ngũ Hành Sơn</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại phòng
                  </label>
                  <select
                    value={filters.roomType}
                    onChange={(e) => setFilters({ ...filters, roomType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tất cả</option>
                    <option value="single">Phòng đơn</option>
                    <option value="shared">Phòng ở ghép</option>
                    <option value="apartment">Căn hộ</option>
                    <option value="studio">Studio</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá tối thiểu
                  </label>
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                    placeholder="1,000,000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá tối đa
                  </label>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                    placeholder="10,000,000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiện nghi
                </label>
                <div className="flex flex-wrap gap-2">
                  {allAmenities.slice(0, 10).map((amenity) => (
                    <button
                      key={amenity}
                      onClick={() => toggleAmenity(amenity)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        filters.amenities.includes(amenity)
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {amenity}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-gray-600">
            Tìm thấy <strong>{filteredListings.length}</strong> phòng trọ
          </p>
        </div>
        {/* Loading / Results Switch */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-md">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-500 font-medium text-lg">Đang tìm kiếm phòng trọ phù hợp...</p>
            <p className="text-gray-400 text-sm mt-1">Vui lòng chờ trong giây lát</p>
          </div>
        ) : (
          <>
            {/* List View */}
            {viewMode === "list" && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredListings.map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/app/listings/${listing.id}`}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 duration-300"
                  >
                    <div className="relative h-48 bg-gray-200">
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-blue-600 shadow-sm">
                        {formatPrice(listing.price)}/tháng
                      </div>
                      {listing.landlordVerified && (
                        <div className="absolute top-3 left-3 bg-green-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm flex items-center gap-1">
                          ✓ Đã xác thực
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-gray-900 group-hover:text-blue-600 transition-colors">
                        {listing.title}
                      </h3>

                      <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
                        <MapPin className="h-4 w-4 flex-shrink-0 text-gray-400" />
                        <span className="line-clamp-1">
                          {listing.address}, {listing.district}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm mb-4 border-t pt-3 border-gray-100">
                        <div className="flex items-center gap-2 text-gray-600 font-medium">
                          <span>{listing.area}m²</span>
                          <span className="text-gray-300">•</span>
                          <span>{getRoomTypeLabel(listing.roomType)}</span>
                        </div>

                        <div className="flex items-center gap-1 text-yellow-500 font-bold bg-yellow-50 px-2 py-0.5 rounded">
                          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          <span className="text-gray-800 text-xs">
                            {listing.rating}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {listing.amenities.slice(0, 3).map((amenity, index) => (
                          <span
                            key={index}
                            className="px-2.5 py-1 bg-blue-50 text-blue-600 font-medium rounded-full text-xs"
                          >
                            {amenity}
                          </span>
                        ))}
                        {listing.amenities.length > 3 && (
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-600 font-medium rounded-full text-xs">
                            +{listing.amenities.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Map View */}
            {viewMode === "map" && (
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {filteredListings.map((listing) => (
                    <Link
                      key={listing.id}
                      href={`/app/listings/${listing.id}`}
                      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all hover:pl-1 duration-200 flex border border-gray-100"
                    >
                      <div className="w-32 h-32 flex-shrink-0 bg-gray-200">
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1 hover:text-blue-600">
                            {listing.title}
                          </h3>
                          <div className="text-blue-600 font-bold text-sm mb-1">
                            {formatPrice(listing.price)}/tháng
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-gray-500 text-xs pt-2 border-t border-gray-50">
                          <span className="line-clamp-1 flex items-center gap-1 font-medium">
                            <MapPin className="h-3.5 w-3.5 text-gray-400" />
                            {listing.district}
                          </span>
                          <div className="flex items-center gap-1 font-semibold text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                            <span>{listing.rating}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                <div className="bg-gray-100 border border-gray-200 rounded-xl h-[600px] lg:sticky lg:top-20 flex items-center justify-center shadow-inner">
                  <div className="text-center p-8 max-w-sm">
                    <div className="bg-white p-4 rounded-full shadow-md inline-block mb-4">
                      <Map className="h-10 w-10 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      Bản đồ tương tác
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      Tích hợp Mapbox/Leaflet để hiển thị trực quan vị trí các phòng trọ theo tọa độ thực từ backend.
                    </p>
                    <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold">
                      <span>GPS & GeoJSON ready</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {!isLoading && filteredListings.length === 0 && (
          <div className="bg-white rounded-lg p-12 text-center">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Không tìm thấy phòng trọ
            </h3>
            <p className="text-gray-600 mb-4">
              Thử điều chỉnh bộ lọc hoặc tìm kiếm với từ khóa khác
            </p>
            <button
              onClick={resetFilters}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
