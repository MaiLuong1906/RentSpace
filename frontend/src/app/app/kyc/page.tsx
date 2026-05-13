"use client";

import { useState } from "react";
import { Shield, Upload, CheckCircle, Clock, XCircle } from "lucide-react";
import { mockCurrentUser } from "@/lib/mockData";

export default function KYCPage() {
  const [kycStatus, setKycStatus] = useState(mockCurrentUser.kycStatus);
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, side: "front" | "back") => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (side === "front") {
          setFrontImage(reader.result as string);
        } else {
          setBackImage(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Call API POST /api/v1/kyc/submit
    console.log("Submit KYC");
    setKycStatus("pending");
  };

  const renderStatus = () => {
    switch (kycStatus) {
      case "approved":
        return (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-900 mb-2">
              Tài khoản đã được xác thực
            </h2>
            <p className="text-green-700">
              Danh tính của bạn đã được xác minh thành công
            </p>
          </div>
        );

      case "pending":
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <Clock className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-yellow-900 mb-2">
              Đang chờ xét duyệt
            </h2>
            <p className="text-yellow-700">
              Hồ sơ KYC của bạn đang được admin xem xét. Vui lòng chờ trong 1-2 ngày làm việc.
            </p>
          </div>
        );

      case "rejected":
        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center mb-6">
            <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-900 mb-2">
              Hồ sơ bị từ chối
            </h2>
            <p className="text-red-700 mb-4">
              Hồ sơ KYC của bạn không đủ tiêu chuẩn. Vui lòng nộp lại với hình ảnh rõ nét hơn.
            </p>
            <button
              onClick={() => setKycStatus("not_submitted")}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Nộp lại hồ sơ
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  if (kycStatus === "approved" || kycStatus === "pending") {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-8">Xác thực danh tính (KYC)</h1>
          {renderStatus()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Xác thực danh tính (KYC)</h1>
        </div>

        {kycStatus === "rejected" && renderStatus()}

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Tại sao cần xác thực KYC?</h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Tăng độ tin cậy và uy tín trên nền tảng</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Bảo vệ cộng đồng khỏi lừa đảo và gian lận</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Mở khóa đầy đủ tính năng của nền tảng</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">Nộp hồ sơ xác thực</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Upload hình ảnh CCCD/CMND
              </label>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Mặt trước</p>
                  <label className="block cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                      {frontImage ? (
                        <img
                          src={frontImage}
                          alt="CCCD mặt trước"
                          className="w-full h-48 object-contain"
                        />
                      ) : (
                        <div>
                          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Nhấn để upload</p>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "front")}
                      required
                    />
                  </label>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Mặt sau</p>
                  <label className="block cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                      {backImage ? (
                        <img
                          src={backImage}
                          alt="CCCD mặt sau"
                          className="w-full h-48 object-contain"
                        />
                      ) : (
                        <div>
                          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Nhấn để upload</p>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "back")}
                      required
                    />
                  </label>
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Lưu ý:</strong> Hình ảnh phải rõ nét, đủ sáng và hiển thị đầy đủ thông tin. Tránh chụp mờ, tối hoặc bị che khuất.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="consent"
                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                required
              />
              <label htmlFor="consent" className="ml-2 text-sm text-gray-700">
                Tôi đồng ý cho RentSpace xử lý thông tin cá nhân của tôi theo{" "}
                <a href="#" className="text-blue-600 hover:text-blue-700">
                  Chính sách bảo mật
                </a>{" "}
                và{" "}
                <a href="#" className="text-blue-600 hover:text-blue-700">
                  Nghị định 13/2023/NĐ-CP
                </a>
              </label>
            </div>

            <button
              type="submit"
              disabled={!frontImage || !backImage}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Nộp hồ sơ xác thực
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
