"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Eye } from "lucide-react";

interface KYCSubmission {
  id: string;
  userId: string;
  userName: string;
  email: string;
  phone: string;
  frontImage: string;
  backImage: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
}

export default function AdminKYCPage() {
  const [submissions] = useState<KYCSubmission[]>([
    {
      id: "1",
      userId: "user1",
      userName: "Nguyễn Văn A",
      email: "nguyenvana@example.com",
      phone: "0901234567",
      frontImage: "https://via.placeholder.com/400x250?text=CCCD+Mat+Truoc",
      backImage: "https://via.placeholder.com/400x250?text=CCCD+Mat+Sau",
      submittedAt: "2026-05-12T10:30:00Z",
      status: "pending",
    },
    {
      id: "2",
      userId: "user2",
      userName: "Trần Thị B",
      email: "tranthib@example.com",
      phone: "0912345678",
      frontImage: "https://via.placeholder.com/400x250?text=CCCD+Mat+Truoc",
      backImage: "https://via.placeholder.com/400x250?text=CCCD+Mat+Sau",
      submittedAt: "2026-05-12T09:15:00Z",
      status: "pending",
    },
  ]);

  const [selectedSubmission, setSelectedSubmission] = useState<KYCSubmission | null>(null);

  const handleApprove = (id: string) => {
    // TODO: Call API PATCH /api/v1/admin/kyc/:id/approve
    console.log("Approve KYC:", id);
    setSelectedSubmission(null);
  };

  const handleReject = (id: string) => {
    // TODO: Call API PATCH /api/v1/admin/kyc/:id/reject
    console.log("Reject KYC:", id);
    setSelectedSubmission(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Duyệt hồ sơ KYC</h1>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người dùng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Liên hệ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày nộp
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {submissions.filter((s) => s.status === "pending").map((submission) => (
                  <tr key={submission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{submission.userName}</div>
                      <div className="text-sm text-gray-600">{submission.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{submission.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {new Date(submission.submittedAt).toLocaleDateString("vi-VN")}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(submission.submittedAt).toLocaleTimeString("vi-VN")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedSubmission(submission)}
                          className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-semibold"
                        >
                          <Eye className="h-4 w-4 inline mr-1" />
                          Xem chi tiết
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {submissions.filter((s) => s.status === "pending").length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Không có hồ sơ KYC nào chờ duyệt
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Xét duyệt hồ sơ KYC</h2>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Thông tin người dùng</h3>
              <div className="grid md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600">Họ tên</div>
                  <div className="font-semibold">{selectedSubmission.userName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Email</div>
                  <div className="font-semibold">{selectedSubmission.email}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Số điện thoại</div>
                  <div className="font-semibold">{selectedSubmission.phone}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Ngày nộp</div>
                  <div className="font-semibold">
                    {new Date(selectedSubmission.submittedAt).toLocaleString("vi-VN")}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Hình ảnh CCCD</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600 mb-2">Mặt trước</div>
                  <img
                    src={selectedSubmission.frontImage}
                    alt="CCCD mặt trước"
                    className="w-full rounded-lg border border-gray-200"
                  />
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-2">Mặt sau</div>
                  <img
                    src={selectedSubmission.backImage}
                    alt="CCCD mặt sau"
                    className="w-full rounded-lg border border-gray-200"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
              >
                Đóng
              </button>
              <button
                onClick={() => handleReject(selectedSubmission.id)}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 flex items-center justify-center gap-2"
              >
                <XCircle className="h-5 w-5" />
                Từ chối
              </button>
              <button
                onClick={() => handleApprove(selectedSubmission.id)}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <CheckCircle className="h-5 w-5" />
                Phê duyệt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
