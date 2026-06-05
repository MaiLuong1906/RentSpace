"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Loader2, Locate } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { listingApi } from "@/lib/api/listing.api";
import type { CreateListingRequest } from "@/types/listing.types";
import { toast } from "sonner";

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

export default function CreateListingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdListingId, setCreatedListingId] = useState<number | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: 16.0544,
    lng: 108.2022,
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
    try {
      const fullAddress = `${formData.address}, ${formData.district || ""}, ${formData.city}`;
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`;
      const response = await fetch(url, {
        headers: {
          "User-Agent": "RentSpaceApp/1.0",
        },
      });
      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setCoords({ lat, lng });
        toast.success("Đã tìm thấy vị trí gợi ý trên bản đồ!");
      } else {
        toast.error("Không tìm thấy tọa độ cho địa chỉ này. Bạn có thể tự ghim trên bản đồ.");
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
                    Quận/Huyện <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Chọn quận/huyện</option>
                    <option value="Hải Châu">Hải Châu</option>
                    <option value="Thanh Khê">Thanh Khê</option>
                    <option value="Sơn Trà">Sơn Trà</option>
                    <option value="Liên Chiểu">Liên Chiểu</option>
                    <option value="Ngũ Hành Sơn">Ngũ Hành Sơn</option>
                    <option value="Cẩm Lệ">Cẩm Lệ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thành phố
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    readOnly
                  />
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
                  initialViewState={{
                    latitude: coords.lat,
                    longitude: coords.lng,
                    zoom: 14,
                  }}
                  latitude={coords.lat}
                  longitude={coords.lng}
                  onMove={(evt) => setCoords({ lat: evt.viewState.latitude, lng: evt.viewState.longitude })}
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
    </div>
  );
}
