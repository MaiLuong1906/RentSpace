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
} from "lucide-react";
import { mockListings, formatPrice, getRoomTypeLabel } from "@/lib/mockData";

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

  const allAmenities = Array.from(
    new Set(mockListings.flatMap((l) => l.amenities))
  );

  const filteredListings = mockListings.filter((listing) => {
    if (filters.query && !listing.title.toLowerCase().includes(filters.query.toLowerCase()) &&
        !listing.address.toLowerCase().includes(filters.query.toLowerCase())) {
      return false;
    }
    if (filters.district && listing.district !== filters.district) {
      return false;
    }
    if (filters.roomType && listing.roomType !== filters.roomType) {
      return false;
    }
    if (filters.minPrice && listing.price < parseInt(filters.minPrice)) {
      return false;
    }
    if (filters.maxPrice && listing.price > parseInt(filters.maxPrice)) {
      return false;
    }
    if (filters.minArea && listing.area < parseInt(filters.minArea)) {
      return false;
    }
    if (filters.amenities.length > 0) {
      if (!filters.amenities.every((a) => listing.amenities.includes(a))) {
        return false;
      }
    }
    return true;
  });

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

        {/* List View */}
        {viewMode === "list" && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <Link
                key={listing.id}
                href={`/app/listings/${listing.id}`}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="relative h-48 bg-gray-200">
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full text-sm font-semibold text-blue-600">
                    {formatPrice(listing.price)}/tháng
                  </div>
                  {listing.landlordVerified && (
                    <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      ✓ Đã xác thực
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                    {listing.title}
                  </h3>

                  <div className="flex items-center gap-1 text-gray-600 text-sm mb-2">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="line-clamp-1">
                      {listing.address}, {listing.district}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm mb-3">
                    <div className="flex items-center gap-3 text-gray-600">
                      <span>{listing.area}m²</span>
                      <span>•</span>
                      <span>{getRoomTypeLabel(listing.roomType)}</span>
                    </div>

                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="font-semibold text-gray-900">
                        {listing.rating}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {listing.amenities.slice(0, 3).map((amenity, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                      >
                        {amenity}
                      </span>
                    ))}
                    {listing.amenities.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
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
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow flex"
                >
                  <div className="w-32 h-32 flex-shrink-0 bg-gray-200">
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3 flex-1">
                    <h3 className="font-semibold mb-1 line-clamp-1">
                      {listing.title}
                    </h3>
                    <div className="text-blue-600 font-semibold mb-2">
                      {formatPrice(listing.price)}/tháng
                    </div>
                    <div className="flex items-center gap-1 text-gray-600 text-sm">
                      <MapPin className="h-3 w-3" />
                      <span className="line-clamp-1 text-xs">
                        {listing.district}
                      </span>
                      <span className="mx-1">•</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs">{listing.rating}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="bg-gray-200 rounded-lg h-[600px] lg:sticky lg:top-20 flex items-center justify-center">
              <div className="text-center p-8">
                <Map className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Bản đồ tương tác
                </h3>
                <p className="text-gray-600">
                  Tích hợp Mapbox/Leaflet để hiển thị vị trí phòng trọ
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  (Sẽ được tích hợp trong phiên bản production)
                </p>
              </div>
            </div>
          </div>
        )}

        {filteredListings.length === 0 && (
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
