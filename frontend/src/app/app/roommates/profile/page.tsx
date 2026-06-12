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
  Activity
} from "lucide-react";
import { roommateApi } from "@/lib/api/roommate.api";
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
  { id: "Music-lover", label: "🎵 Yêu âm nhạc" }
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

  // Form State
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
        // Kiểm tra thực tế KYC từ API Backend
        const kycRes = await kycApi.getKycStatus();
        const isVerified = kycRes.success && kycRes.data?.status === "VERIFIED";
        setKycVerified(isVerified);

        if (!isVerified) {
          setLoading(false);
          return;
        }

        // Tải hồ sơ hiện có
        try {
          const profileRes = await roommateApi.getProfile();
          if (profileRes.success && profileRes.data) {
            const profile = profileRes.data;
            setGender(profile.gender || "Male");
            setOccupation(profile.occupation || "");
            setBudgetMin(profile.budgetMin?.toString() || "1000000");
            setBudgetMax(profile.budgetMax?.toString() || "3000000");
            
            const area = profile.preferredArea || "";
            setPreferredArea(area);
            setMoveInDate(profile.moveInDate ? profile.moveInDate.split("T")[0] : "");
            setSelectedTags(profile.lifestyleTags || []);
            setBio(profile.bio || "");
            setIsActive(profile.isActive ?? true);

            // Phân tích tỉnh thành quận huyện từ chuỗi preferredArea có sẵn
            if (area.includes(",")) {
              const parts = area.split(",");
              const dist = parts[0].trim();
              const city = parts[1].trim();
              const matchedCity = Object.keys(CITY_DISTRICTS).find(
                c => c.toLowerCase() === city.toLowerCase() || city.toLowerCase().includes(c.toLowerCase())
              );
              if (matchedCity) {
                setSelectedCity(matchedCity);
                const matchedDist = CITY_DISTRICTS[matchedCity].find(
                  d => d.toLowerCase() === dist.toLowerCase() || dist.toLowerCase().includes(d.toLowerCase())
                );
                if (matchedDist) {
                  setSelectedDistrict(matchedDist);
                }
              }
            } else if (area) {
              const matchedCity = Object.keys(CITY_DISTRICTS).find(c => area.toLowerCase().includes(c.toLowerCase()));
              if (matchedCity) {
                setSelectedCity(matchedCity);
                const matchedDist = CITY_DISTRICTS[matchedCity].find(d => area.toLowerCase().includes(d.toLowerCase()));
                if (matchedDist) {
                  setSelectedDistrict(matchedDist);
                }
              }
            }
          }
        } catch (profileError: unknown) {
          const apiError = profileError as { response?: { status?: number } };
          // Nếu chưa có hồ sơ (404), giữ giá trị mặc định để tạo mới
          if (apiError.response?.status !== 404) {
            console.error("Lỗi khi tải hồ sơ:", profileError);
          }
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

  const handleToggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const min = parseFloat(budgetMin);
    const max = parseFloat(budgetMax);

    if (isNaN(min) || min < 0) {
      toast.error("Ngân sách tối thiểu không hợp lệ.");
      return;
    }
    if (isNaN(max) || max < min) {
      toast.error("Ngân sách tối đa phải lớn hơn hoặc bằng ngân sách tối thiểu.");
      return;
    }
    if (!selectedCity || !selectedDistrict) {
      toast.error("Vui lòng chọn Tỉnh / Thành phố và Quận / Huyện mong muốn.");
      return;
    }
    if (!moveInDate) {
      toast.error("Vui lòng chọn ngày dọn vào.");
      return;
    }
    if (selectedTags.length === 0) {
      toast.error("Vui lòng chọn ít nhất một nhãn phong cách sống.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await roommateApi.updateProfile({
        gender,
        occupation,
        budgetMin: min,
        budgetMax: max,
        preferredArea,
        moveInDate,
        lifestyleTags: selectedTags,
        bio,
        isActive
      });

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

  // Khóa tính năng nếu chưa KYC
  if (kycVerified === false) {
    return (
      <div className="min-h-[85vh] bg-gray-50/50 py-12 flex items-center justify-center px-4">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md bg-white border border-gray-150 shadow-2xl rounded-3xl p-8 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 to-rose-500" />
          <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-extrabold text-gray-800 mb-2">Yêu cầu xác thực danh tính</h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            Để bảo vệ an toàn cho cộng đồng và sử dụng tính năng tìm bạn ở ghép (Roommate Matching), tài khoản của bạn cần được xác minh danh tính hoàn tất.
          </p>
          <Link
            href="/app/kyc"
            className="block w-full bg-blue-600 text-white py-3.5 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-95"
          >
            Định danh ngay (eKYC)
          </Link>
          <Link
            href="/app"
            className="block w-full mt-3 text-sm font-bold text-gray-500 hover:text-gray-800 py-2 transition-all"
          >
            Quay lại trang chủ
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Nút quay lại */}
        <Link 
          href="/app/roommates" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-blue-600 mb-6 group transition-colors"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span>Quay lại Dashboard</span>
        </Link>

        {/* Tiêu đề */}
        <div className="bg-white border border-gray-150 rounded-3xl p-6 sm:p-8 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Thông tin cơ bản */}
          <div className="bg-white border border-gray-150 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-base font-extrabold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Thông tin phong cách sống
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Giới tính */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">Giới tính</label>
                <div className="grid grid-cols-3 gap-3">
                  {["Male", "Female", "Other"].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setGender(item)}
                      className={`py-3 text-xs font-bold rounded-2xl transition-all border ${
                        gender === item 
                          ? "bg-blue-50 border-blue-400 text-blue-600 shadow-sm" 
                          : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
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
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="VD: Sinh viên, Lập trình viên..."
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Ngân sách tối thiểu */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">Ngân sách tối thiểu (VNĐ)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    step="100000"
                    required
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-semibold"
                  />
                </div>
              </div>

              {/* Ngân sách tối đa */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">Ngân sách tối đa (VNĐ)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    step="100000"
                    required
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-semibold"
                  />
                </div>
              </div>

              {/* Tỉnh / Thành phố mong muốn */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">Tỉnh / Thành phố mong muốn</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                  <select
                    required
                    value={selectedCity}
                    onChange={(e) => {
                      const city = e.target.value;
                      setSelectedCity(city);
                      setSelectedDistrict("");
                      setPreferredArea(city);
                    }}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white"
                  >
                    <option value="">-- Chọn Tỉnh / Thành phố --</option>
                    {Object.keys(CITY_DISTRICTS).map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quận / Huyện mong muốn */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">Quận / Huyện mong muốn</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                  <select
                    required
                    disabled={!selectedCity}
                    value={selectedDistrict}
                    onChange={(e) => {
                      const dist = e.target.value;
                      setSelectedDistrict(dist);
                      setPreferredArea(`${dist}, ${selectedCity}`);
                    }}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white disabled:opacity-50"
                  >
                    <option value="">-- Chọn Quận / Huyện --</option>
                    {selectedCity && CITY_DISTRICTS[selectedCity].map((dist) => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ngày dự kiến dọn vào */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">Ngày dự kiến dọn vào</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    required
                    value={moveInDate}
                    onChange={(e) => setMoveInDate(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Phong cách sống & Nhãn */}
          <div className="bg-white border border-gray-150 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Thói quen & Lối sống cá nhân
            </h2>
            <p className="text-xs text-gray-400">Chọn những thẻ mô tả đúng nhất về bạn. Các thẻ này được thuật toán tính tương hợp Jaccard đánh giá đối chiếu trực tiếp.</p>
            
            <div className="flex flex-wrap gap-2.5 pt-2">
              {PREDEFINED_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleToggleTag(tag.id)}
                    className={`px-4 py-2.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 ${
                      isSelected 
                        ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20" 
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300"
                    }`}
                  >
                    <span>{tag.label}</span>
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Giới thiệu bản thân & Trạng thái hiển thị */}
          <div className="bg-white border border-gray-150 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-extrabold text-gray-800 border-b border-gray-100 pb-3 mb-4">
                Giới thiệu bản thân
              </h2>
              <textarea
                placeholder="Chia sẻ một chút về tính cách của bạn, các yêu cầu đặc biệt khác về bạn cùng phòng..."
                maxLength={500}
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm resize-none"
              />
              <div className="text-right text-xs text-gray-400 font-semibold mt-1">
                {bio.length}/500 ký tự
              </div>
            </div>

            {/* Trạng thái hoạt động */}
            <div className="flex items-center justify-between bg-blue-50/20 border border-blue-100/30 rounded-2xl p-4.5">
              <div>
                <h3 className="text-xs font-bold text-gray-800">Hiển thị hồ sơ ở ghép</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Tắt tùy chọn này nếu bạn đã tìm được bạn ở ghép hoặc tạm dừng tìm kiếm.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isActive} 
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl font-extrabold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all text-sm flex items-center justify-center gap-2"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>Lưu & Cập nhật hồ sơ</span>
              </>
            )}
          </button>
          
        </form>
      </div>
    </div>
  );
}
