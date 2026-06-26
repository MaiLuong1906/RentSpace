"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  User,
  MapPin,
  Calendar,
  DollarSign,
  Briefcase,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  Save,
  Check,
  AlertCircle,
  Activity,
  Home,
  Search,
  Users,
  Hash,
  Link2,
  Link2Off,
} from "lucide-react";
import { roommateApi, RoommateProfileRequest } from "@/lib/api/roommate.api";
import { listingApi } from "@/lib/api/listing.api";
import { Listing } from "@/types/listing.types";
import { kycApi } from "@/lib/api/kyc.api";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Link from "next/link";

const PREDEFINED_TAGS = [
  { id: "Non-smoker", label: "🚭 Không hút thuốc" },
  { id: "Clean", label: "🧼 Sạch sẽ, ngăn nắp" },
  { id: "Quiet", label: "🤫 Thích yên tĩnh" },
  { id: "Pet-friendly", label: "🐾 Yêu động vật" },
  { id: "Night-owl", label: "🦉 Hoạt động ban đêm" },
  { id: "Early-bird", label: "🐦 Dậy sớm" },
  { id: "Cooks-at-home", label: "🍳 Thích nấu ăn" },
  { id: "Social", label: "👥 Thân thiện, hòa đồng" },
  { id: "Private", label: "🔒 Tôn trọng riêng tư" },
  { id: "Music-lover", label: "🎵 Yêu âm nhạc" },
];

const CITY_DISTRICTS: Record<string, string[]> = {
  "Đà Nẵng": ["Hải Châu", "Thanh Khê", "Sơn Trà", "Liên Chiểu", "Ngũ Hành Sơn", "Cẩm Lệ", "Hòa Vang"],
  "Hà Nội": ["Cầu Giấy", "Đống Đa", "Ba Đình", "Hai Bà Trưng", "Hoàn Kiếm", "Thanh Xuân", "Nam Từ Liêm", "Bắc Từ Liêm", "Tây Hồ", "Hoàng Mai", "Long Biên", "Hà Đông"],
  "Hồ Chí Minh": ["Quận 1", "Quận 3", "Quận 4", "Quận 5", "Quận 6", "Quận 7", "Quận 8", "Quận 10", "Quận 11", "Quận 12", "Bình Thạnh", "Gò Vấp", "Tân Bình", "Tân Phú", "Bình Tân", "Thủ Đức", "Phú Nhuận"],
};

export default function RoommateProfilePage() {
  const { status: authStatus } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [kycVerified, setKycVerified] = useState<boolean | null>(null);

  // Loại hồ sơ
  const [profileType, setProfileType] = useState<'SEEKING_ROOM' | 'HAS_ROOM'>('SEEKING_ROOM');

  // Trường dành riêng cho HAS_ROOM
  const [selectedListingId, setSelectedListingId] = useState<number | null>(null);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [maxOccupants, setMaxOccupants] = useState<string>("3");
  const [currentOccupants, setCurrentOccupants] = useState<string>("1");

  // Trường chung
  const [gender, setGender] = useState<string>("Male");
  const [occupation, setOccupation] = useState<string>("");
  const [budgetMin, setBudgetMin] = useState<string>("1000000");
  const [budgetMax, setBudgetMax] = useState<string>("3000000");
  const [preferredArea, setPreferredArea] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [moveInDate, setMoveInDate] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [bio, setBio] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(true);

  useEffect(() => {
    if (authStatus === "loading") return;
    if (authStatus === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    const checkKycAndFetchProfile = async () => {
      try {
        setLoading(true);
        const kycRes = await kycApi.getKycStatus();
        const isVerified = kycRes.success && kycRes.data?.status === "VERIFIED";
        setKycVerified(isVerified);
        if (!isVerified) { setLoading(false); return; }

        try {
          const profileRes = await roommateApi.getProfile();
          if (profileRes.success && profileRes.data) {
            const p = profileRes.data;
            setProfileType(p.profileType || 'SEEKING_ROOM');
            setSelectedListingId(p.listingId ?? null);
            setMaxOccupants(p.maxOccupants?.toString() || "3");
            setCurrentOccupants(p.currentOccupants?.toString() || "1");
            setGender(p.gender || "Male");
            setOccupation(p.occupation || "");
            setBudgetMin(p.budgetMin?.toString() || "1000000");
            setBudgetMax(p.budgetMax?.toString() || "3000000");
            setMoveInDate(p.moveInDate ? p.moveInDate.split("T")[0] : "");
            setSelectedTags(p.lifestyleTags || []);
            setBio(p.bio || "");
            setIsActive(p.isActive ?? true);

            const area = p.preferredArea || "";
            setPreferredArea(area);
            if (area.includes(",")) {
              const [dist, city] = area.split(",").map(s => s.trim());
              const matchedCity = Object.keys(CITY_DISTRICTS).find(c =>
                c.toLowerCase() === city.toLowerCase() || city.toLowerCase().includes(c.toLowerCase())
              );
              if (matchedCity) {
                setSelectedCity(matchedCity);
                const matchedDist = CITY_DISTRICTS[matchedCity].find(d =>
                  d.toLowerCase() === dist.toLowerCase() || dist.toLowerCase().includes(d.toLowerCase())
                );
                if (matchedDist) setSelectedDistrict(matchedDist);
              }
            } else if (area) {
              const matchedCity = Object.keys(CITY_DISTRICTS).find(c => area.toLowerCase().includes(c.toLowerCase()));
              if (matchedCity) {
                setSelectedCity(matchedCity);
                const matchedDist = CITY_DISTRICTS[matchedCity].find(d => area.toLowerCase().includes(d.toLowerCase()));
                if (matchedDist) setSelectedDistrict(matchedDist);
              }
            }
          }
        } catch (err: unknown) {
          const apiError = err as { response?: { status?: number } };
          if (apiError.response?.status !== 404) console.error("Lỗi khi tải hồ sơ:", err);
        }
      } catch (error) {
        console.error("Lỗi xác minh trạng thái hồ sơ:", error);
        toast.error("Không thể tải dữ liệu hồ sơ.");
      } finally {
        setLoading(false);
      }
    };

    checkKycAndFetchProfile();
  }, [authStatus, router]);

  // Fetch danh sách tin đăng khi user chọn HAS_ROOM
  useEffect(() => {
    if (profileType !== 'HAS_ROOM') return;
    if (myListings.length > 0) return; // đã load rồi thì không load lại
    const fetchListings = async () => {
      try {
        setListingsLoading(true);
        const res = await listingApi.getMyListings({ status: 'ACTIVE', size: 50 });
        if (res.success && res.data?.content) {
          setMyListings(res.data.content);
        }
      } catch {
        // Không có listing thì bỏ qua — không cần thông báo lỗi
      } finally {
        setListingsLoading(false);
      }
    };
    fetchListings();
  }, [profileType]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectListing = (listing: Listing) => {
    if (selectedListingId === listing.id) {
      // Click lại để bỏ chọn
      setSelectedListingId(null);
      return;
    }
    setSelectedListingId(listing.id);
    // Tự động điền khu vực từ listing
    const area = listing.district ? `${listing.district}, ${listing.city}` : listing.city;
    const matchedCity = Object.keys(CITY_DISTRICTS).find(c =>
      listing.city.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(listing.city.toLowerCase())
    );
    if (matchedCity) {
      setSelectedCity(matchedCity);
      const matchedDist = CITY_DISTRICTS[matchedCity].find(d =>
        (listing.district || '').toLowerCase().includes(d.toLowerCase()) || d.toLowerCase().includes((listing.district || '').toLowerCase())
      );
      if (matchedDist) {
        setSelectedDistrict(matchedDist);
        setPreferredArea(`${matchedDist}, ${matchedCity}`);
      } else {
        setPreferredArea(area);
      }
    } else {
      setPreferredArea(area);
    }
    // Tự động điền giá từ listing
    setBudgetMin(listing.pricePerMonth.toString());
    setBudgetMax(listing.pricePerMonth.toString());
  };

  const handleToggleTag = (tagId: string) => {
    setSelectedTags(prev => prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const min = parseFloat(budgetMin);
    const max = parseFloat(budgetMax);
    if (isNaN(min) || min < 0) { toast.error("Ngân sách tối thiểu không hợp lệ."); return; }
    if (isNaN(max) || max < min) { toast.error("Ngân sách tối đa phải lớn hơn hoặc bằng tối thiểu."); return; }
    if (!selectedCity || !selectedDistrict) { toast.error("Vui lòng chọn Tỉnh / Thành phố và Quận / Huyện."); return; }
    if (!moveInDate) { toast.error("Vui lòng chọn ngày."); return; }
    if (selectedTags.length === 0) { toast.error("Vui lòng chọn ít nhất một nhãn phong cách sống."); return; }

    if (profileType === 'HAS_ROOM') {
      const max_ = parseInt(maxOccupants);
      const cur = parseInt(currentOccupants);
      if (isNaN(max_) || max_ < 2) { toast.error("Số người tối đa phải ít nhất là 2."); return; }
      if (isNaN(cur) || cur < 0) { toast.error("Số người hiện tại không hợp lệ."); return; }
      if (cur >= max_) { toast.error("Phòng đã đủ người — hãy tăng số chỗ tối đa hoặc giảm số người hiện tại."); return; }
    }

    try {
      setSubmitting(true);
      const payload: RoommateProfileRequest = {
        profileType,
        gender,
        occupation,
        budgetMin: min,
        budgetMax: max,
        preferredArea,
        moveInDate,
        lifestyleTags: selectedTags,
        bio,
        isActive,
        ...(profileType === 'HAS_ROOM' && {
          listingId: selectedListingId,
          maxOccupants: parseInt(maxOccupants),
          currentOccupants: parseInt(currentOccupants),
        }),
      };

      const res = await roommateApi.updateProfile(payload);
      if (res.success) {
        toast.success("Đã cập nhật hồ sơ tìm bạn ở ghép thành công!");
        router.push("/app/roommates");
      }
    } catch (error) {
      console.error("Lỗi cập nhật hồ sơ:", error);
      toast.error("Không thể cập nhật hồ sơ. Vui lòng kiểm tra lại thông tin.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center">
        <div className="relative w-12 h-12 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
        </div>
        <p className="text-gray-500 text-sm font-semibold">Đang tải thông tin hồ sơ...</p>
      </div>
    );
  }

  if (kycVerified === false) {
    return (
      <div className="min-h-[85vh] bg-gray-50/50 py-12 flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md bg-white border border-gray-150 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-3xl p-8 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 to-rose-500" />
          <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-extrabold text-gray-800 mb-2">Yêu cầu xác thực danh tính</h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            Để sử dụng tính năng tìm bạn ở ghép, tài khoản của bạn cần được xác minh danh tính hoàn tất.
          </p>
          <Link href="/app/kyc" className="block w-full bg-blue-600 text-white py-3.5 rounded-2xl font-bold hover:bg-blue-700 transition-all">
            Định danh ngay (eKYC)
          </Link>
          <Link href="/app" className="block w-full mt-3 text-sm font-bold text-gray-500 hover:text-gray-800 py-2 transition-all">
            Quay lại trang chủ
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/app/roommates" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-blue-600 mb-6 group transition-colors">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span>Quay lại Dashboard</span>
        </Link>

        <div className="bg-white border border-gray-150 rounded-3xl p-6 sm:p-8 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-blue-600" />
              Thiết lập hồ sơ ở ghép
            </h1>
            <p className="text-xs text-gray-400 font-semibold mt-1">Cung cấp thói quen và sở thích để AI giúp bạn kết nối chuẩn xác</p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 px-3.5 py-1.5 rounded-full text-xs font-bold self-start">
            <ShieldCheck className="h-4 w-4" />
            <span>Đã xác minh KYC</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Loại hồ sơ */}
          <div className="bg-white border border-gray-150 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
              <Home className="h-5 w-5 text-blue-600" />
              Bạn đang ở tình huống nào?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* SEEKING_ROOM */}
              <button
                type="button"
                onClick={() => setProfileType('SEEKING_ROOM')}
                className={`relative p-5 rounded-2xl border-2 text-left transition-all ${
                  profileType === 'SEEKING_ROOM'
                    ? 'border-blue-500 bg-blue-50/60 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                {profileType === 'SEEKING_ROOM' && (
                  <span className="absolute top-3 right-3 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </span>
                )}
                <Search className={`h-7 w-7 mb-3 ${profileType === 'SEEKING_ROOM' ? 'text-blue-600' : 'text-gray-400'}`} />
                <p className={`text-sm font-extrabold ${profileType === 'SEEKING_ROOM' ? 'text-blue-700' : 'text-gray-700'}`}>
                  Tôi đang tìm phòng
                </p>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Chưa có phòng, muốn tìm bạn cùng thuê và ở chung
                </p>
              </button>

              {/* HAS_ROOM */}
              <button
                type="button"
                onClick={() => setProfileType('HAS_ROOM')}
                className={`relative p-5 rounded-2xl border-2 text-left transition-all ${
                  profileType === 'HAS_ROOM'
                    ? 'border-violet-500 bg-violet-50/60 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                {profileType === 'HAS_ROOM' && (
                  <span className="absolute top-3 right-3 w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </span>
                )}
                <Home className={`h-7 w-7 mb-3 ${profileType === 'HAS_ROOM' ? 'text-violet-600' : 'text-gray-400'}`} />
                <p className={`text-sm font-extrabold ${profileType === 'HAS_ROOM' ? 'text-violet-700' : 'text-gray-700'}`}>
                  Tôi đã có phòng
                </p>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Đang thuê phòng/nhà và muốn tìm thêm người ở ghép
                </p>
              </button>
            </div>
          </div>

          {/* Thông tin dành riêng cho HAS_ROOM */}
          {profileType === 'HAS_ROOM' && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-violet-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6"
            >
              <h2 className="text-base font-extrabold text-gray-800 border-b border-violet-100 pb-3 flex items-center gap-2">
                <Users className="h-5 w-5 text-violet-600" />
                Thông tin phòng của bạn
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Số người tối đa */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
                    Số người tối đa trong phòng <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      min="2"
                      max="10"
                      required
                      value={maxOccupants}
                      onChange={(e) => setMaxOccupants(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm font-semibold"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1.5">Phòng chứa được tối đa bao nhiêu người?</p>
                </div>

                {/* Số người hiện tại */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
                    Số người đang ở hiện tại <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      min="0"
                      required
                      value={currentOccupants}
                      onChange={(e) => setCurrentOccupants(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm font-semibold"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    Còn <span className="font-bold text-violet-600">
                      {Math.max(0, parseInt(maxOccupants || '0') - parseInt(currentOccupants || '0'))}
                    </span> chỗ trống
                  </p>
                </div>

                {/* Listing picker */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
                    Gắn với tin đăng phòng của bạn
                    <span className="ml-1.5 text-gray-400 font-normal normal-case">(tuỳ chọn)</span>
                  </label>

                  {listingsLoading ? (
                    <div className="flex items-center gap-2 text-xs text-gray-400 py-3">
                      <div className="w-4 h-4 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
                      Đang tải danh sách tin đăng...
                    </div>
                  ) : myListings.length === 0 ? (
                    <div className="flex items-center gap-2.5 text-xs text-gray-400 bg-gray-50 border border-dashed border-gray-200 rounded-2xl px-4 py-3.5">
                      <Link2Off className="h-4 w-4 shrink-0" />
                      <span>Bạn chưa có tin đăng nào đang hoạt động. Có thể bỏ qua bước này.</span>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {/* Option: không gắn */}
                      <button
                        type="button"
                        onClick={() => setSelectedListingId(null)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-left transition-all ${
                          selectedListingId === null
                            ? 'border-gray-400 bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Link2Off className={`h-4 w-4 shrink-0 ${selectedListingId === null ? 'text-gray-600' : 'text-gray-400'}`} />
                        <span className={`text-xs font-bold ${selectedListingId === null ? 'text-gray-700' : 'text-gray-500'}`}>
                          Không gắn với tin đăng nào
                        </span>
                        {selectedListingId === null && (
                          <span className="ml-auto w-4 h-4 rounded-full bg-gray-600 flex items-center justify-center shrink-0">
                            <Check className="h-2.5 w-2.5 text-white" />
                          </span>
                        )}
                      </button>

                      {/* Danh sách listing */}
                      {myListings.map((listing) => {
                        const isSelected = selectedListingId === listing.id;
                        return (
                          <button
                            key={listing.id}
                            type="button"
                            onClick={() => handleSelectListing(listing)}
                            className={`w-full flex items-start gap-3 px-4 py-3.5 rounded-2xl border-2 text-left transition-all ${
                              isSelected
                                ? 'border-violet-500 bg-violet-50/60'
                                : 'border-gray-200 hover:border-violet-200 hover:bg-violet-50/20'
                            }`}
                          >
                            <Home className={`h-4 w-4 mt-0.5 shrink-0 ${isSelected ? 'text-violet-600' : 'text-gray-400'}`} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-bold truncate ${isSelected ? 'text-violet-700' : 'text-gray-700'}`}>
                                {listing.title}
                              </p>
                              <p className="text-[11px] text-gray-400 truncate mt-0.5">
                                {listing.address}
                              </p>
                              <p className={`text-[11px] font-bold mt-1 ${isSelected ? 'text-violet-600' : 'text-gray-500'}`}>
                                {listing.pricePerMonth.toLocaleString('vi-VN')}đ / tháng
                              </p>
                            </div>
                            {isSelected && (
                              <span className="w-4 h-4 rounded-full bg-violet-600 flex items-center justify-center shrink-0 mt-0.5">
                                <Check className="h-2.5 w-2.5 text-white" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {selectedListingId && (
                    <p className="text-[11px] text-violet-600 font-semibold mt-2 flex items-center gap-1">
                      <Link2 className="h-3 w-3" />
                      Khu vực và giá đã được điền tự động từ tin đăng. Bạn vẫn có thể chỉnh sửa bên dưới.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Thông tin phong cách sống */}
          <div className="bg-white border border-gray-150 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-base font-extrabold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              {profileType === 'HAS_ROOM' ? 'Thông tin & phong cách sống của bạn' : 'Thông tin phong cách sống'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Giới tính */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">Giới tính</label>
                <div className="grid grid-cols-3 gap-3">
                  {["Male", "Female", "Other"].map((item) => (
                    <button key={item} type="button" onClick={() => setGender(item)}
                      className={`py-3 text-xs font-bold rounded-2xl transition-all border ${
                        gender === item ? "bg-blue-50 border-blue-400 text-blue-600 shadow-sm" : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {item === "Male" ? "Nam" : item === "Female" ? "Nữ" : "Khác"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nghề nghiệp */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">Nghề nghiệp</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="text" required placeholder="VD: Sinh viên, Lập trình viên..."
                    value={occupation} onChange={(e) => setOccupation(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Ngân sách */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
                  {profileType === 'HAS_ROOM' ? 'Giá phòng / người (VNĐ) — tối thiểu' : 'Ngân sách tối thiểu (VNĐ)'}
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="number" min="0" step="100000" required value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
                  {profileType === 'HAS_ROOM' ? 'Giá phòng / người (VNĐ) — tối đa' : 'Ngân sách tối đa (VNĐ)'}
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="number" min="0" step="100000" required value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-semibold"
                  />
                </div>
              </div>

              {/* Khu vực */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
                  {profileType === 'HAS_ROOM' ? 'Tỉnh / Thành phố của phòng' : 'Tỉnh / Thành phố mong muốn'}
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select required value={selectedCity}
                    onChange={(e) => { setSelectedCity(e.target.value); setSelectedDistrict(""); setPreferredArea(e.target.value); }}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white"
                  >
                    <option value="">-- Chọn Tỉnh / Thành phố --</option>
                    {Object.keys(CITY_DISTRICTS).map((city) => (<option key={city} value={city}>{city}</option>))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
                  {profileType === 'HAS_ROOM' ? 'Quận / Huyện của phòng' : 'Quận / Huyện mong muốn'}
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select required disabled={!selectedCity} value={selectedDistrict}
                    onChange={(e) => { setSelectedDistrict(e.target.value); setPreferredArea(`${e.target.value}, ${selectedCity}`); }}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white disabled:opacity-50"
                  >
                    <option value="">-- Chọn Quận / Huyện --</option>
                    {selectedCity && CITY_DISTRICTS[selectedCity].map((dist) => (<option key={dist} value={dist}>{dist}</option>))}
                  </select>
                </div>
              </div>

              {/* Ngày */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
                  {profileType === 'HAS_ROOM' ? 'Ngày phòng có sẵn' : 'Ngày dự kiến dọn vào'}
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input type="date" required value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Phong cách sống */}
          <div className="bg-white border border-gray-150 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Thói quen & Lối sống cá nhân
            </h2>
            <p className="text-xs text-gray-400">Chọn những thẻ mô tả đúng nhất về bạn. Các thẻ này được thuật toán Jaccard đánh giá đối chiếu trực tiếp.</p>
            <div className="flex flex-wrap gap-2.5 pt-2">
              {PREDEFINED_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag.id);
                return (
                  <button key={tag.id} type="button" onClick={() => handleToggleTag(tag.id)}
                    className={`px-4 py-2.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 ${
                      isSelected ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <span>{tag.label}</span>
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bio & Hiển thị */}
          <div className="bg-white border border-gray-150 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-extrabold text-gray-800 border-b border-gray-100 pb-3 mb-4">Giới thiệu bản thân</h2>
              <textarea placeholder="Chia sẻ một chút về tính cách, yêu cầu đặc biệt với bạn cùng phòng..." maxLength={1000} rows={4}
                value={bio} onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm resize-none"
              />
              <div className="text-right text-xs text-gray-400 font-semibold mt-1">{bio.length}/1000 ký tự</div>
            </div>

            <div className="flex items-center justify-between bg-blue-50/20 border border-blue-100/30 rounded-2xl p-4">
              <div>
                <h3 className="text-xs font-bold text-gray-800">Hiển thị hồ sơ ở ghép</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Tắt nếu bạn đã tìm được bạn ở ghép hoặc tạm dừng tìm kiếm.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>
          </div>

          <button type="submit" disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-extrabold transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <><Save className="h-5 w-5" /><span>Lưu & Cập nhật hồ sơ</span></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
