"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Loader2, Locate, AlertOctagon, ArrowLeft, ArrowUpCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { listingApi } from "@/lib/api/listing.api";
import { getCurrentSubscription } from "@/lib/api/subscription.api";
import type { CreateListingRequest } from "@/types/listing.types";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PriceSuggestionWidget } from "@/components/shared/PriceSuggestionWidget";
import { FRONTEND_TO_BACKEND_ROOM_TYPE } from "@/lib/constants/roomTypes";

import Map, { Marker } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const osmStyle = {
  version: 8 as const,
  sources: {
    "osm-tiles": {
      type: "raster" as const,
      tiles: [
        "https://basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors, © CARTO",
    },
  },
  layers: [
    {
      id: "osm-tiles-layer",
      type: "raster" as const,
      source: "osm-tiles",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const CITY_DISTRICTS: Record<string, string[]> = {
  "Đà Nẵng": [
    "Hải Châu",
    "Thanh Khê",
    "Sơn Trà",
    "Liên Chiểu",
    "Ngũ Hành Sơn",
    "Cẩm Lệ",
    "Hòa Vang"
  ],
  "Hà Nội": [
    "Cầu Giấy",
    "Đống Đa",
    "Ba Đình",
    "Hoàn Kiếm",
    "Hai Bà Trưng",
    "Tây Hồ",
    "Thanh Xuân",
    "Hoàng Mai",
    "Long Biên",
    "Nam Từ Liêm",
    "Bắc Từ Liêm",
    "Hà Đông"
  ],
  "Hồ Chí Minh": [
    "Quận 1",
    "Quận 3",
    "Quận 4",
    "Quận 5",
    "Quận 6",
    "Quận 7",
    "Quận 8",
    "Quận 10",
    "Quận 11",
    "Quận 12",
    "Bình Thạnh",
    "Gò Vấp",
    "Phú Nhuận",
    "Tân Bình",
    "Tân Phú",
    "Thủ Đức",
    "Bình Tân"
  ]
};

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "Đà Nẵng": { lat: 16.0544, lng: 108.2022 },
  "Hà Nội": { lat: 21.0285, lng: 105.8542 },
  "Hồ Chí Minh": { lat: 10.7769, lng: 106.7009 }
};

export default function CreateListingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [limitReached, setLimitReached] = useState(false);
  const [checkingLimit, setCheckingLimit] = useState(true);
  const [currentPlanName, setCurrentPlanName] = useState("FREE");
  const [maxListingsCount, setMaxListingsCount] = useState(10);
  
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdListingId, setCreatedListingId] = useState<number | null>(null);

  useEffect(() => {
    const checkUserSubscriptionLimit = async () => {
      try {
        const subData = await getCurrentSubscription();
        if (subData) {
          setLimitReached(subData.limitReached);
          setCurrentPlanName(subData.subscription?.plan.displayName || "FREE");
          setMaxListingsCount(subData.subscription?.plan.maxListings || 10);
        }
      } catch (err) {
        console.error("Error checking subscription limit:", err);
      } finally {
        setCheckingLimit(false);
      }
    };
    checkUserSubscriptionLimit();
  }, []);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: 16.0544,
    lng: 108.2022,
  });
  const [viewport, setViewport] = useState({
    latitude: 16.0544,
    longitude: 108.2022,
    zoom: 14,
  });
  const [geocoding, setGeocoding] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    address: "",
    district: "",
    city: "Đà Nẵng",
    area: "",
    roomType: "single",
    amenities: [] as string[],
  });

  const allAmenities = [
    "WiFi",
    "Điều hòa",
    "Nóng lạnh",
    "Giường",
    "Tủ quần áo",
    "Ban công",
    "Máy giặt",
    "Tủ lạnh",
    "Bếp",
    "Thang máy",
    "Bảo vệ 24/7",
    "Gửi xe miễn phí",
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const files = Array.from(e.target.files || []);
    
    // Validate image mime types only
    const validImageFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        setError(`Tệp "${file.name}" không hợp lệ. Chỉ chấp nhận các định dạng hình ảnh (JPEG, PNG, WEBP,...)`);
        return false;
      }
      return true;
    });

    if (validImageFiles.length === 0) return;

    setImageFiles((prev) => [...prev, ...validImageFiles]);

    validImageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleAmenity = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleGeocode = async () => {
    if (!formData.address) {
      toast.error("Vui lòng nhập số nhà, tên đường trước.");
      return;
    }
    setGeocoding(true);

    const searchQueries = [
      // 1. Full address query with country
      `${formData.address}, ${formData.district ? 'Quận ' + formData.district : ''}, ${formData.city}, Việt Nam`,
      // 2. Street and City query
      `${formData.address}, ${formData.city}, Việt Nam`,
      // 3. District and City query fallback
      `${formData.district ? 'Quận ' + formData.district : ''}, ${formData.city}, Việt Nam`
    ];

    try {
      let found = false;
      for (let i = 0; i < searchQueries.length; i++) {
        const query = searchQueries[i];
        if (!query.trim()) continue;
        
        // Trì hoãn 1 giây từ request thứ 2 trở đi để tuân thủ giới hạn của Nominatim API
        if (i > 0) {
          await sleep(1000);
        }
        
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
        const response = await fetch(url, {
          headers: {
            "User-Agent": "RentSpaceApp/1.0",
          },
        });
        
        if (!response.ok) continue;
        const data = await response.json();
        
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          setCoords({ lat, lng });
          setViewport((prev) => ({ ...prev, latitude: lat, longitude: lng }));
          toast.success(`Định vị gợi ý theo khu vực: "${data[0].display_name.split(',')[0]}"`);
          found = true;
          break;
        }
      }

      if (!found) {
        toast.error("Không tìm thấy địa điểm trên. Bạn có thể tự ghim trên bản đồ.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi tìm tọa độ tự động.");
    } finally {
      setGeocoding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      let listingId = createdListingId;

      // 1. Create the listing if not already created (prevents double submits on retry)
      if (!listingId) {
        const payload: CreateListingRequest = {
          title: formData.title,
          description: formData.description,
          address: formData.address,
          district: formData.district || undefined,
          city: formData.city,
          latitude: coords.lat,
          longitude: coords.lng,
          pricePerMonth: Number(formData.price),
          areaM2: Number(formData.area),
          hasWifi: formData.amenities.includes("WiFi"),
          hasParking: formData.amenities.includes("Gửi xe miễn phí") || formData.amenities.includes("Bảo vệ 24/7"),
          hasAirConditioner: formData.amenities.includes("Điều hòa"),
          hasWashingMachine: formData.amenities.includes("Máy giặt"),
          allowPets: false,
          roomType: FRONTEND_TO_BACKEND_ROOM_TYPE[formData.roomType] || "PHONG_TRO",
        };

        const response = await listingApi.createListing(payload);
        listingId = response.data.id;
        setCreatedListingId(listingId);
      }

      // 2. Upload image files sequentially or in parallel
      if (imageFiles.length > 0) {
        await Promise.all(
          imageFiles.map((file) => listingApi.uploadImage(listingId!, file))
        );
      }

      // Clear current state and cache to force update on land page
      setCreatedListingId(null);
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      queryClient.invalidateQueries({ queryKey: ["listings"] });

      router.push("/app/landlord/my-listings");
    } catch (err) {
      console.error("Error creating listing:", err);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorResponse = err as any;
      const responseData = errorResponse?.response?.data;

      // Format validation errors nicely
      if (responseData?.data && typeof responseData.data === "object") {
        const errorMessages = Object.entries(responseData.data)
          .map(([field, msg]) => `• ${field}: ${msg}`)
          .join("\n");
        setError(`${responseData.message}:\n${errorMessages}`);
      } else {
        setError(responseData?.message || "Đã có lỗi xảy ra khi tạo tin đăng.");
      }

      // Auto scroll to the error message box
      setTimeout(() => {
        const errorEl = document.getElementById("error-message");
        if (errorEl) {
          errorEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 50);
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingLimit) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-8">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Đang kiểm tra hạn mức đăng tin...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Đăng tin phòng trọ mới</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Images */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Hình ảnh phòng trọ</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={image}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {images.length < 10 && (
                <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">Thêm ảnh</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
            </div>

            <p className="text-sm text-gray-600 mt-4">
              Tối đa 10 ảnh. Ảnh đầu tiên sẽ là ảnh đại diện.
            </p>
          </div>

          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Thông tin cơ bản</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiêu đề <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: Phòng trọ tiện nghi gần Đại học Bách Khoa"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả <span className="text-red-600">*</span>
                </label>
                <textarea
                  rows={5}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Mô tả chi tiết về phòng trọ..."
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá thuê (VNĐ/tháng) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="3500000"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diện tích (m²) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="25"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại phòng <span className="text-red-600">*</span>
                </label>
                <select
                  value={formData.roomType}
                  onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="single">Phòng đơn</option>
                  <option value="shared">Phòng ở ghép</option>
                  <option value="apartment">Căn hộ</option>
                  <option value="studio">Studio</option>
                </select>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <PriceSuggestionWidget
                  city={formData.city}
                  district={formData.district}
                  roomType={formData.roomType}
                  area={Number(formData.area)}
                  currentPrice={Number(formData.price)}
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Địa chỉ</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số nhà, tên đường <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="123 Đường Lê Duẩn"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thành phố <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={formData.city}
                    onChange={(e) => {
                      const selectedCity = e.target.value;
                      const coords = CITY_COORDS[selectedCity] || CITY_COORDS["Đà Nẵng"];
                      setFormData({ 
                        ...formData, 
                        city: selectedCity, 
                        district: "" 
                      });
                      setCoords(coords);
                      setViewport({
                        latitude: coords.lat,
                        longitude: coords.lng,
                        zoom: 12,
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {Object.keys(CITY_DISTRICTS).map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quận/Huyện <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Chọn quận/huyện</option>
                    {(CITY_DISTRICTS[formData.city] || []).map((district) => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleGeocode}
                  disabled={geocoding}
                  className="mt-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg font-medium hover:bg-blue-100 transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {geocoding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Locate className="h-4 w-4" />}
                  Định vị địa chỉ trên bản đồ
                </button>
              </div>

              <div className="mt-4 border border-gray-200 rounded-2xl overflow-hidden h-[300px] relative shadow-inner">
                <Map
                  {...viewport}
                  onMove={(evt) => setViewport(evt.viewState)}
                  style={{ width: "100%", height: "100%" }}
                  mapLib={maplibregl}
                  mapStyle={osmStyle}
                  onClick={(e) => {
                    setCoords({ lat: e.lngLat.lat, lng: e.lngLat.lng });
                  }}
                >
                  <Marker
                    latitude={coords.lat}
                    longitude={coords.lng}
                    draggable
                    onDragEnd={(e) => {
                      setCoords({ lat: e.lngLat.lat, lng: e.lngLat.lng });
                    }}
                  />
                </Map>
                <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-xl border border-gray-150 text-xs text-gray-750 flex items-center justify-between shadow-sm z-10">
                  <span>Tọa độ ghim: <strong>{coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}</strong></span>
                  <span className="font-semibold text-blue-650">Kéo ghim hoặc click bản đồ để chỉnh sửa</span>
                </div>
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Tiện nghi</h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {allAmenities.map((amenity) => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`p-3 rounded-lg border-2 text-left transition-colors ${
                    formData.amenities.includes(amenity)
                      ? "border-blue-600 bg-blue-50 text-blue-600"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div id="error-message" className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg text-red-700 text-sm font-medium whitespace-pre-line">
              ⚠️ {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push("/app/landlord/my-listings")}
              disabled={submitting}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Đang đăng tin...
                </>
              ) : (
                "Đăng tin"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Subscription Limit Upsell Modal */}
      <Dialog open={limitReached} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.08)] p-0">
          <div className="bg-red-600 px-6 py-7 text-white text-center">
            <div className="inline-flex p-3 bg-white/20 rounded-full mb-3">
              <AlertOctagon className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="text-lg font-bold tracking-tight">Đã Đạt Giới Hạn Đăng Tin</DialogTitle>
            <DialogDescription className="text-red-100 text-xs mt-1">
              Bạn cần nâng cấp gói cước để tiếp tục sử dụng dịch vụ.
            </DialogDescription>
          </div>

          <div className="p-6 space-y-5 text-center">
            <div className="space-y-2">
              <p className="text-sm text-gray-600 leading-relaxed">
                Tài khoản của bạn hiện đang sử dụng gói <strong className="text-gray-900">{currentPlanName}</strong> và đã chạm mốc giới hạn tối đa <strong className="text-red-600">{maxListingsCount} tin đăng hiển thị</strong>.
              </p>
              <p className="text-xs text-gray-400">
                Hãy nâng cấp lên gói Seller Pro để có ngay hạn mức đăng tin lên tới 50 tin hiển thị cùng nhiều đặc quyền ưu tiên khác.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => router.push("/app/landlord/subscription")}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <ArrowUpCircle className="h-4 w-4" />
                Nâng cấp gói cước ngay
              </button>
              <button
                type="button"
                onClick={() => router.push("/app/landlord/my-listings")}
                className="w-full py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại danh sách tin
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
