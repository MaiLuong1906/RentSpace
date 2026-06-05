"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search as SearchIcon,
  SlidersHorizontal,
  MapPin,
  Star,
  Map as MapIcon,
  List as ListIcon,
  Loader2,
  Navigation,
  Compass,
  Locate,
  ChevronRight,
  Info
} from "lucide-react";
import { useListings, useNearbyListings } from "@/hooks/useListings";
import { toast } from "sonner";
import { formatPrice, getRoomTypeLabel } from "@/lib/mockData";

// Conditionally import Mapbox GL only on the client side
import Map, { Marker, Popup, NavigationControl, ViewStateChangeEvent } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

type ViewMode = "list" | "map";
type SearchMode = "standard" | "nearby";

interface SearchListing {
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
  roomType: "single" | "shared" | "apartment" | "house";
  images: string[];
  amenities: string[];
  landlordId: string;
  landlordName: string;
  landlordAvatar: string;
  landlordVerified: boolean;
  status: "available" | "rented";
  createdAt: string;
  rating: number;
  reviewCount: number;
}

export default function SearchPage() {
  // Search Mode & View Mode
  const [searchMode, setSearchMode] = useState<SearchMode>("standard");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showFilters, setShowFilters] = useState(false);
  
  // Standard Filters
  const [filters, setFilters] = useState({
    query: "",
    district: "",
    roomType: "",
    minPrice: "",
    maxPrice: "",
    minArea: "",
    amenities: [] as string[],
  });

  // Nearby/GPS Search State
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [radius, setRadius] = useState<number>(2.0); // Bán kính tìm kiếm (km)
  const [selectedListing, setSelectedListing] = useState<SearchListing | null>(null);
  const [mapViewport, setMapViewport] = useState({
    latitude: 16.0544, // Mặc định Đà Nẵng
    longitude: 108.2022,
    zoom: 13,
  });

  // Check if Mapbox token is configured
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const isMapboxTokenValid = mapboxToken && mapboxToken.startsWith("pk.ey");

  // Fetch standard listings
  const { data: standardResponse, isLoading: standardLoading } = useListings({
    city: "Đà Nẵng",
    district: filters.district || undefined,
    minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
    minArea: filters.minArea ? Number(filters.minArea) : undefined,
    size: 50,
  });

  // Fetch nearby listings (only enabled when in nearby mode and coordinates are available)
  const { data: nearbyResponse, isLoading: nearbyLoading } = useNearbyListings({
    lat: userCoords?.lat || 0,
    lng: userCoords?.lng || 0,
    radius: radius,
    limit: 50,
  });

  const isLoading = searchMode === "standard" ? standardLoading : nearbyLoading;
  const rawListings = searchMode === "standard" 
    ? (standardResponse?.data?.content || []) 
    : (nearbyResponse?.data || []);

  // Transform listings to unified UI representation
  const transformedListings = rawListings.map((l) => {
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
      roomType: "single" as const,
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

  // Client-side local filtering for fields not natively handled by API
  const filteredListings = transformedListings.filter((listing) => {
    // 1. Text keyword query matching title or address
    if (filters.query &&
        !listing.title.toLowerCase().includes(filters.query.toLowerCase()) &&
        !listing.address.toLowerCase().includes(filters.query.toLowerCase())) {
      return false;
    }
    // 2. Room Type filter
    if (filters.roomType && listing.roomType !== filters.roomType) {
      return false;
    }
    // 3. Amenity matching
    if (filters.amenities.length > 0) {
      if (!filters.amenities.every((a) => listing.amenities.includes(a))) {
        return false;
      }
    }
    return true;
  });

  // Extract unique amenities list
  const allAmenities = Array.from(
    new Set(transformedListings.flatMap((l) => l.amenities))
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

  // Get User Current Location
  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Trình duyệt của bạn không hỗ trợ định vị GPS.");
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserCoords(coords);
        setMapViewport({
          latitude: coords.lat,
          longitude: coords.lng,
          zoom: 14,
        });
        setGpsLoading(false);
        toast.success("Đã lấy được vị trí GPS hiện tại!");
      },
      (error) => {
        console.error("Lỗi lấy vị trí GPS:", error);
        setGpsLoading(false);
        toast.error("Không thể lấy vị trí của bạn. Vui lòng cấp quyền truy cập GPS.");
        
        // Fallback to default Da Nang center for simulation/testing
        const fallbackCoords = { lat: 16.0544, lng: 108.2022 };
        setUserCoords(fallbackCoords);
        setMapViewport({
          latitude: fallbackCoords.lat,
          longitude: fallbackCoords.lng,
          zoom: 14,
        });
      }
    );
  };

  // Switch to GPS mode
  useEffect(() => {
    if (searchMode === "nearby" && !userCoords) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      requestUserLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchMode]);

  // Adjust viewport based on search mode / listings center
  useEffect(() => {
    if (filteredListings.length > 0 && searchMode === "standard") {
      // Find average coordinates of listings
      const avgLat = filteredListings.reduce((sum, l) => sum + l.lat, 0) / filteredListings.length;
      const avgLng = filteredListings.reduce((sum, l) => sum + l.lng, 0) / filteredListings.length;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMapViewport((prev) => ({
        ...prev,
        latitude: avgLat,
        longitude: avgLng,
      }));
    }
  }, [filteredListings, searchMode]);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Page Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
              Tìm kiếm phòng trọ
            </h1>
            <p className="text-xs text-gray-400 font-medium mt-1">
              Tìm kiếm phòng trọ lý tưởng theo khu vực hành chính hoặc quét bán kính xung quanh vị trí của bạn
            </p>
          </div>

          {/* Search Mode Switches */}
          <div className="bg-white border border-gray-150 p-1.5 rounded-2xl flex gap-1 shadow-sm self-start md:self-auto">
            <button
              onClick={() => setSearchMode("standard")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                searchMode === "standard"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                  : "text-gray-650 hover:bg-gray-50"
              }`}
            >
              <Compass className="inline h-3.5 w-3.5 mr-1" />
              <span>Tìm theo khu vực</span>
            </button>
            <button
              onClick={() => setSearchMode("nearby")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                searchMode === "nearby"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                  : "text-gray-650 hover:bg-gray-50"
              }`}
            >
              <Navigation className="inline h-3.5 w-3.5 mr-1" />
              <span>Tìm lân cận (GPS)</span>
            </button>
          </div>
        </div>

        {/* Dynamic Filters & Settings Panel */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/20 p-5 mb-8">
          {searchMode === "standard" ? (
            /* Standard Search Input */
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={filters.query}
                  onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                  placeholder="Tìm theo tiêu đề, địa chỉ, từ khóa..."
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-gray-55"
                />
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-1.5 px-5 py-3 rounded-2xl border text-xs font-bold transition-all ${
                    showFilters
                      ? "bg-blue-50 text-blue-600 border-blue-200"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>Bộ lọc nâng cao</span>
                  {(filters.district || filters.roomType || filters.amenities.length > 0) && (
                    <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-[10px] font-bold ml-1">
                      {[filters.district, filters.roomType, ...filters.amenities].filter(Boolean).length}
                    </span>
                  )}
                </button>

                <div className="bg-gray-100 p-1 rounded-2xl flex gap-1 border border-gray-150">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2.5 rounded-xl transition-all ${
                      viewMode === "list"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    title="Dạng danh sách"
                  >
                    <ListIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("map")}
                    className={`p-2.5 rounded-xl transition-all ${
                      viewMode === "map"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    title="Dạng bản đồ"
                  >
                    <MapIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* GPS Nearby Search Settings */
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={requestUserLocation}
                    disabled={gpsLoading}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/10 active:scale-95 transition-all"
                  >
                    {gpsLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Locate className="h-4 w-4" />
                    )}
                    <span>{userCoords ? "Cập nhật vị trí GPS" : "Lấy vị trí hiện tại"}</span>
                  </button>

                  {userCoords ? (
                    <div className="text-xs text-gray-500 font-medium">
                      Tọa độ của bạn: <span className="font-bold text-gray-800">{userCoords.lat.toFixed(5)}, {userCoords.lng.toFixed(5)}</span>
                    </div>
                  ) : (
                    <div className="text-xs text-amber-600 font-medium flex items-center gap-1 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-xl">
                      <Info className="h-3.5 w-3.5 text-amber-500" />
                      <span>Chưa có tọa độ GPS. Hãy click để quét vị trí của bạn</span>
                    </div>
                  )}
                </div>

                {/* Switch Layout for Nearby Search */}
                <div className="bg-gray-100 p-1 rounded-2xl flex gap-1 border border-gray-150 self-start md:self-auto">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2.5 rounded-xl transition-all ${
                      viewMode === "list"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    title="Dạng danh sách"
                  >
                    <ListIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("map")}
                    className={`p-2.5 rounded-xl transition-all ${
                      viewMode === "map"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    title="Dạng bản đồ"
                  >
                    <MapIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Radius Adjustment Slider */}
              <div className="pt-3 border-t border-gray-100 grid md:grid-cols-2 gap-6 items-center">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-gray-600">
                    <span>Bán kính quét xung quanh</span>
                    <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">{radius} km</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="15.0"
                    step="0.5"
                    value={radius}
                    onChange={(e) => setRadius(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 font-semibold">
                    <span>0.5 km</span>
                    <span>5.0 km</span>
                    <span>10.0 km</span>
                    <span>15.0 km</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-600 mb-1">Tìm nhanh theo từ khóa lân cận</label>
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={filters.query}
                      onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                      placeholder="Lọc nhanh kết quả lân cận..."
                      className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-gray-55"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Collapsible Filter Panel */}
          {showFilters && searchMode === "standard" && (
            <div className="mt-5 pt-5 border-t border-gray-100 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-gray-800">Bộ lọc chi tiết</h3>
                <button
                  onClick={resetFilters}
                  className="text-xs text-blue-650 hover:text-blue-750 font-bold"
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">Quận/Huyện (Đà Nẵng)</label>
                  <select
                    value={filters.district}
                    onChange={(e) => setFilters({ ...filters, district: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-gray-55"
                  >
                    <option value="">Tất cả quận huyện</option>
                    <option value="Hải Châu">Quận Hải Châu</option>
                    <option value="Thanh Khê">Quận Thanh Khê</option>
                    <option value="Sơn Trà">Quận Sơn Trà</option>
                    <option value="Liên Chiểu">Quận Liên Chiểu</option>
                    <option value="Ngũ Hành Sơn">Quận Ngũ Hành Sơn</option>
                    <option value="Cẩm Lệ">Quận Cẩm Lệ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">Loại phòng</label>
                  <select
                    value={filters.roomType}
                    onChange={(e) => setFilters({ ...filters, roomType: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-gray-55"
                  >
                    <option value="">Tất cả loại hình</option>
                    <option value="single">Phòng đơn</option>
                    <option value="shared">Phòng ghép</option>
                    <option value="apartment">Căn hộ</option>
                    <option value="house">Nhà nguyên căn</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">Giá tối thiểu (đ)</label>
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                    placeholder="1,000,000"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-gray-55"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">Giá tối đa (đ)</label>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                    placeholder="10,000,000"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-gray-55"
                  />
                </div>
              </div>

              {/* Dynamic Amenities List */}
              {allAmenities.length > 0 && (
                <div className="pt-2">
                  <label className="block text-xs font-bold text-gray-600 mb-2.5">Tiện ích đi kèm</label>
                  <div className="flex flex-wrap gap-1.5">
                    {allAmenities.map((amenity) => (
                      <button
                        key={amenity}
                        onClick={() => toggleAmenity(amenity)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                          filters.amenities.includes(amenity)
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {amenity}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results Info Bar */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-500 font-semibold">
            Tìm thấy <strong className="text-gray-800 font-extrabold">{filteredListings.length}</strong> phòng trọ phù hợp
          </p>
        </div>

        {/* Dynamic Views Rendering */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-100 rounded-3xl shadow-xl shadow-gray-200/5">
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-500 text-sm font-semibold">Đang tìm kiếm phòng trọ phù hợp...</p>
            <p className="text-gray-400 text-xs mt-1 font-medium">Vui lòng đợi trong giây lát</p>
          </div>
        ) : (
          <>
            {/* List View Mode */}
            {viewMode === "list" && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredListings.map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/app/listings/${listing.id}`}
                    className="bg-white rounded-3xl border border-gray-100 shadow-lg shadow-gray-200/10 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="relative h-48 bg-gray-200">
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-blue-600 shadow-sm border border-gray-100">
                        {formatPrice(listing.price)}/tháng
                      </div>
                      {listing.landlordVerified && (
                        <div className="absolute top-3 left-3 bg-emerald-500 text-white px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-1 uppercase tracking-wider">
                          ✓ Đã KYC
                        </div>
                      )}
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-extrabold text-gray-900 mb-2 line-clamp-1 hover:text-blue-600 transition-colors">
                          {listing.title}
                        </h3>

                        <div className="flex items-center gap-1 text-gray-500 text-xs mb-3 font-medium">
                          <MapPin className="h-4 w-4 flex-shrink-0 text-gray-400" />
                          <span className="line-clamp-1">{listing.address}, {listing.district}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2.5 text-gray-600 font-bold text-xs">
                          <span>{listing.area} m²</span>
                          <span>•</span>
                          <span>{getRoomTypeLabel(listing.roomType)}</span>
                        </div>

                        <div className="flex items-center gap-1 text-yellow-500">
                          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          <span className="font-extrabold text-gray-900 text-xs">{listing.rating}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Map View Mode */}
            {viewMode === "map" && (
              <div className="grid lg:grid-cols-3 gap-6">
                
                {/* Listings List (1 Column) */}
                <div className="space-y-4 max-h-[600px] overflow-y-auto lg:col-span-1 pr-2">
                  {filteredListings.map((listing) => (
                    <div
                      key={listing.id}
                      onClick={() => {
                        setSelectedListing(listing);
                        setMapViewport((prev) => ({
                          ...prev,
                          latitude: listing.lat,
                          longitude: listing.lng,
                          zoom: 15,
                        }));
                      }}
                      className={`bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all cursor-pointer flex border ${
                        selectedListing?.id === listing.id ? "border-blue-600 ring-2 ring-blue-500/10" : "border-gray-100"
                      }`}
                    >
                      <div className="w-24 h-24 flex-shrink-0 bg-gray-105">
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-gray-800 text-xs line-clamp-1">
                            {listing.title}
                          </h4>
                          <div className="text-blue-600 font-extrabold text-xs mt-1">
                            {formatPrice(listing.price)}/tháng
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-gray-400 text-[10px] pt-1.5 border-t border-gray-50 font-semibold">
                          <span className="line-clamp-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {listing.district}
                          </span>
                          <span className="text-gray-800 flex items-center gap-0.5">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            {listing.rating}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredListings.length === 0 && (
                    <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                      <p className="text-xs text-gray-450 font-semibold">Không tìm thấy phòng trọ nào để định vị.</p>
                    </div>
                  )}
                </div>

                {/* Map Component (2 Columns) */}
                <div className="lg:col-span-2 bg-gray-100 border border-gray-200 rounded-3xl h-[600px] relative overflow-hidden shadow-inner">
                  {isMapboxTokenValid ? (
                    /* Real Mapbox Map */
                    <Map
                      {...mapViewport}
                      onMove={(evt: ViewStateChangeEvent) => setMapViewport(evt.viewState)}
                      style={{ width: "100%", height: "100%" }}
                      mapStyle="mapbox://styles/mapbox/streets-v12"
                      mapboxAccessToken={mapboxToken}
                    >
                      <NavigationControl position="top-right" />

                      {/* User Current Location Marker */}
                      {userCoords && (
                        <Marker latitude={userCoords.lat} longitude={userCoords.lng}>
                          <div className="relative flex items-center justify-center">
                            <span className="absolute inline-flex h-8 w-8 rounded-full bg-blue-500/20 opacity-35 animate-ping"></span>
                            <span className="relative rounded-full h-4.5 w-4.5 bg-blue-600 border-2 border-white shadow-md flex items-center justify-center">
                              <Navigation className="h-2 w-2 text-white fill-white rotate-45" />
                            </span>
                          </div>
                        </Marker>
                      )}

                      {/* Listing Markers */}
                      {filteredListings.map((listing) => (
                        <Marker
                          key={listing.id}
                          latitude={listing.lat}
                          longitude={listing.lng}
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          onClick={(e: any) => {
                            e.originalEvent.stopPropagation();
                            setSelectedListing(listing);
                          }}
                        >
                          <button
                            className={`px-2 py-1 rounded-lg font-extrabold text-[10px] shadow-md border active:scale-95 transition-all ${
                              selectedListing?.id === listing.id
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-blue-700 border-blue-100 hover:bg-blue-50"
                            }`}
                          >
                            {formatPrice(listing.price).replace("đ", "").replace(".000.000", "M").replace(".000", "k")}
                          </button>
                        </Marker>
                      ))}

                      {/* Selected Listing Popup Info */}
                      {selectedListing && (
                        <Popup
                          latitude={selectedListing.lat}
                          longitude={selectedListing.lng}
                          anchor="bottom"
                          onClose={() => setSelectedListing(null)}
                          closeOnClick={false}
                          className="z-40"
                        >
                          <Link href={`/app/listings/${selectedListing.id}`} className="block w-48 p-1">
                            <img
                              src={selectedListing.images[0]}
                              alt={selectedListing.title}
                              className="w-full h-24 object-cover rounded-lg mb-2"
                            />
                            <h5 className="font-extrabold text-xs text-gray-900 line-clamp-1 mb-0.5">
                              {selectedListing.title}
                            </h5>
                            <p className="text-blue-600 font-extrabold text-xs">
                              {formatPrice(selectedListing.price)}/tháng
                            </p>
                            <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold mt-1">
                              <span>{selectedListing.area} m²</span>
                              <span className="text-blue-650 flex items-center gap-0.5 text-xs">
                                Chi tiết <ChevronRight className="h-3 w-3" />
                              </span>
                            </div>
                          </Link>
                        </Popup>
                      )}
                    </Map>
                  ) : (
                    /* Fallback Premium Interactive Simulated Map (Used when Mapbox token is missing/placeholder) */
                    <div className="absolute inset-0 bg-slate-900/95 flex flex-col justify-between p-6 overflow-hidden">
                      {/* Grid background to mimic maps */}
                      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                      
                      {/* Header warning notification */}
                      <div className="relative bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl flex items-start gap-3 z-10 shadow-lg text-white">
                        <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold">Chế độ Bản đồ Mô phỏng (Demo Mode)</h4>
                          <p className="text-[10px] text-white/70 leading-relaxed mt-0.5">
                            Mapbox token chưa được cấu hình. Để hiển thị bản đồ vệ tinh thật, hãy điền khóa Mapbox cá nhân vào biến <code className="bg-white/10 px-1 py-0.5 rounded font-mono text-[9px]">NEXT_PUBLIC_MAPBOX_TOKEN</code> trong file <code className="bg-white/10 px-1 py-0.5 rounded font-mono text-[9px]">.env.local</code>.
                          </p>
                        </div>
                      </div>

                      {/* Dynamic Simulated Interactive Map Layout */}
                      <div className="flex-1 relative flex items-center justify-center my-4 border border-white/10 rounded-2xl bg-slate-950/60 overflow-hidden shadow-inner">
                        <div className="absolute inset-0 flex items-center justify-center">
                          {/* Radius Scanning Animation */}
                          {userCoords && searchMode === "nearby" && (
                            <div
                              className="border-2 border-blue-500/35 bg-blue-500/5 rounded-full flex items-center justify-center transition-all duration-300"
                              style={{
                                width: `${Math.min(180 + radius * 12, 380)}px`,
                                height: `${Math.min(180 + radius * 12, 380)}px`,
                              }}
                            >
                              <div className="h-full w-full rounded-full border border-blue-500/20 animate-pulse bg-blue-500/5"></div>
                            </div>
                          )}

                          {/* Radar scanning arm decoration */}
                          {searchMode === "nearby" && (
                            <div className="absolute w-64 h-64 border border-blue-500/10 rounded-full animate-spin [animation-duration:10s] flex items-start justify-center">
                              <div className="w-0.5 h-32 bg-gradient-to-t from-transparent to-blue-500/40"></div>
                            </div>
                          )}

                          {/* Center Coordinates compass marker */}
                          <div className="relative flex items-center justify-center z-10">
                            <span className="absolute inline-flex h-10 w-10 rounded-full bg-blue-400/20 opacity-40 animate-ping"></span>
                            <span className="h-5 w-5 rounded-full bg-blue-600 border-2 border-white shadow-xl flex items-center justify-center">
                              <Navigation className="h-2.5 w-2.5 text-white fill-white rotate-45" />
                            </span>
                            <span className="absolute -bottom-5 text-[9px] font-bold text-blue-400 bg-slate-900/90 border border-slate-700/50 px-2 py-0.5 rounded-full whitespace-nowrap">
                              Vị trí quét (GPS)
                            </span>
                          </div>

                          {/* Plot markers relative to the center based on coords difference */}
                          {filteredListings.map((listing) => {
                            const centerLat = userCoords?.lat || 16.0544;
                            const centerLng = userCoords?.lng || 108.2022;
                            
                            // Exaggerate differences for better visual layout on the mock screen
                            const latDiff = (listing.lat - centerLat) * 350;
                            const lngDiff = (listing.lng - centerLng) * 350;
                            
                            // Constrain offsets within visual viewport bounds
                            const clampedX = Math.max(-160, Math.min(160, lngDiff));
                            const clampedY = Math.max(-130, Math.min(130, latDiff));

                            return (
                              <button
                                key={listing.id}
                                onClick={() => setSelectedListing(listing)}
                                style={{
                                  transform: `translate(${clampedX}px, ${-clampedY}px)`,
                                }}
                                className={`absolute px-2.5 py-1 rounded-xl text-[10px] font-bold shadow-lg border-2 z-20 transition-all ${
                                  selectedListing?.id === listing.id
                                    ? "bg-blue-600 text-white border-white scale-110"
                                    : "bg-slate-900 text-blue-400 border-blue-500/30 hover:border-blue-400"
                                }`}
                              >
                                📌 {formatPrice(listing.price).replace("đ", "").replace(".000.000", "M").replace(".000", "k")}
                              </button>
                            );
                          })}
                        </div>

                        {/* Selected Listing Popup inside Simulation Map */}
                        {selectedListing && (
                          <div className="absolute bottom-4 left-4 right-4 bg-slate-900/95 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3 z-30 shadow-2xl backdrop-blur-md text-white">
                            <img
                              src={selectedListing.images[0]}
                              alt={selectedListing.title}
                              className="w-16 h-16 object-cover rounded-xl border border-white/10"
                            />
                            <div className="flex-1 min-w-0">
                              <h5 className="font-bold text-xs text-white line-clamp-1">
                                {selectedListing.title}
                              </h5>
                              <p className="text-blue-400 font-extrabold text-xs mt-0.5">
                                {formatPrice(selectedListing.price)}/tháng
                              </p>
                              <div className="flex justify-between items-center text-[9px] text-white/50 font-semibold mt-1.5 font-sans">
                                <span>{selectedListing.area} m² • {selectedListing.district}</span>
                                <Link
                                  href={`/app/listings/${selectedListing.id}`}
                                  className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-0.5"
                                >
                                  Xem chi tiết <ChevronRight className="h-3 w-3" />
                                </Link>
                              </div>
                            </div>
                            <button
                              onClick={() => setSelectedListing(null)}
                              className="absolute top-2 right-2 text-white/40 hover:text-white/80 text-xs font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Map Controls Decoration footer */}
                      <div className="relative flex justify-between items-center text-[10px] text-white/40 font-semibold z-10">
                        <span>Tọa độ trung tâm: {userCoords ? `${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)}` : "16.0544, 108.2022"}</span>
                        <span>Đã tìm thấy {filteredListings.length} phòng trong bán kính</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Empty States */}
        {!isLoading && filteredListings.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center shadow-xl shadow-gray-200/5">
            <SearchIcon className="h-14 w-14 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-1">
              Không tìm thấy phòng trọ nào
            </h3>
            <p className="text-xs text-gray-400 mb-5 font-semibold">
              Không tìm thấy bài viết nào khớp với từ khóa lọc hoặc khoảng cách quét lân cận hiện tại.
            </p>
            <button
              onClick={resetFilters}
              className="px-5 py-2.5 bg-blue-50 text-blue-650 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
