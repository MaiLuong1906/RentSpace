"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Upload, X, Loader2, ArrowLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { listingApi } from "@/lib/api/listing.api";
import type { CreateListingRequest, ListingImage } from "@/types/listing.types";

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const listingIdStr = params?.id ? String(params.id) : "";

  // Data states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  // Images state
  const [existingImages, setExistingImages] = useState<ListingImage[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);
  const [newImages, setNewImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);

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

  // Fetch listing data on mount
  useEffect(() => {
    if (!listingIdStr) return;

    const fetchListing = async () => {
      try {
        const response = await listingApi.getListingById(listingIdStr);
        const l = response.data;

        // Map amenities boolean to string array
        const amenities: string[] = [];
        if (l.hasWifi) amenities.push("WiFi");
        if (l.hasAirConditioner) amenities.push("Điều hòa");
        if (l.hasWashingMachine) amenities.push("Máy giặt");
        if (l.hasParking) amenities.push("Gửi xe miễn phí");
        // default maps
        
        setFormData({
          title: l.title,
          description: l.description || "",
          price: String(l.pricePerMonth),
          address: l.address,
          district: l.district || "",
          city: l.city || "Đà Nẵng",
          area: l.areaM2 ? String(l.areaM2) : "",
          roomType: "single",
          amenities,
        });

        setExistingImages(l.images || []);
        setLoading(false);
      } catch (err) {
        console.error("Error loading listing details:", err);
        setError("Không thể tải thông tin phòng trọ.");
        setLoading(false);
      }
    };

    fetchListing();
  }, [listingIdStr]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const files = Array.from(e.target.files || []);
    
    // Validate image types
    const validImageFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        setError(`Tệp "${file.name}" không hợp lệ. Chỉ chấp nhận định dạng hình ảnh (JPEG, PNG, WEBP,...)`);
        return false;
      }
      return true;
    });

    if (validImageFiles.length === 0) return;

    setNewImageFiles((prev) => [...prev, ...validImageFiles]);

    validImageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeExistingImage = (imageId: number) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
    setDeletedImageIds((prev) => [...prev, imageId]);
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleAmenity = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      // 1. Update basic information
      const payload: CreateListingRequest = {
        title: formData.title,
        description: formData.description,
        address: formData.address,
        district: formData.district || undefined,
        city: formData.city,
        pricePerMonth: Number(formData.price),
        areaM2: Number(formData.area),
        hasWifi: formData.amenities.includes("WiFi"),
        hasParking: formData.amenities.includes("Gửi xe miễn phí") || formData.amenities.includes("Bảo vệ 24/7"),
        hasAirConditioner: formData.amenities.includes("Điều hòa"),
        hasWashingMachine: formData.amenities.includes("Máy giặt"),
        allowPets: false,
      };

      await listingApi.updateListing(listingIdStr, payload);

      // 2. Delete selected existing images
      if (deletedImageIds.length > 0) {
        await Promise.all(
          deletedImageIds.map((id) => listingApi.deleteImage(listingIdStr, id))
        );
      }

      // 3. Upload new images
      if (newImageFiles.length > 0) {
        await Promise.all(
          newImageFiles.map((file) => listingApi.uploadImage(listingIdStr, file))
        );
      }

      setSuccess("Cập nhật tin đăng thành công!");
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      
      // Delay navigation slightly to let the user see success message
      setTimeout(() => {
        router.push("/app/landlord/my-listings");
      }, 1500);
    } catch (err) {
      console.error("Error updating listing:", err);
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
        setError(responseData?.message || "Đã xảy ra lỗi khi cập nhật thông tin.");
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Đang tải thông tin phòng trọ...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            type="button"
            onClick={() => router.push("/app/landlord/my-listings")}
            className="p-2 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-3xl font-bold">Chỉnh sửa tin đăng phòng trọ</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Images Section */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Hình ảnh phòng trọ</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Existing Images */}
              {existingImages.map((image) => (
                <div key={image.id} className="relative aspect-square">
                  <img
                    src={image.imageUrl}
                    alt="Existing"
                    className="w-full h-full object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(image.id)}
                    className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                    title="Xóa ảnh này"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {/* Newly Uploaded Previews */}
              {newImages.map((image, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={image}
                    alt={`New Upload ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg border border-blue-300"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(index)}
                    className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {existingImages.length + newImages.length < 10 && (
                <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600 font-medium">Thêm ảnh mới</span>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Thông tin chi tiết</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiêu đề tin đăng <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ví dụ: Phòng trọ khép kín đầy đủ tiện nghi quận Sơn Trà"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả chi tiết <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={5}
                  placeholder="Mô tả các thông tin như giờ giấc, tiện ích xung quanh, chi phí phát sinh..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá thuê (VNĐ/tháng) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="Ví dụ: 3500000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    placeholder="Ví dụ: 25"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Địa chỉ phòng trọ</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số nhà, tên đường <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Ví dụ: 123 Nguyễn Văn Linh"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Amenities Section */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Tiện nghi</h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {allAmenities.map((amenity) => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`p-3 rounded-lg border-2 text-left transition-colors font-medium ${
                    formData.amenities.includes(amenity)
                      ? "border-blue-600 bg-blue-50 text-blue-600"
                      : "border-gray-200 hover:border-gray-300 text-gray-700"
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div id="error-message" className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg text-red-700 text-sm font-medium whitespace-pre-line">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg text-green-700 text-sm font-medium">
              ✅ {success}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push("/app/landlord/my-listings")}
              disabled={submitting}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                  Đang lưu thay đổi...
                </>
              ) : (
                "Lưu thay đổi"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
