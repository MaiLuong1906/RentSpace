"use client";

import { Flag, CheckCircle, XCircle } from "lucide-react";

interface Report {
  id: string;
  listingId: string;
  listingTitle: string;
  reportedBy: string;
  reason: string;
  description: string;
  createdAt: string;
  status: "pending" | "resolved" | "dismissed";
}

export default function AdminReportsPage() {
  const reports: Report[] = [
    {
      id: "1",
      listingId: "1",
      listingTitle: "Phòng trọ tiện nghi gần Đại học Bách Khoa",
      reportedBy: "Nguyễn Văn A",
      reason: "Thông tin sai lệch",
      description: "Giá thực tế cao hơn giá đăng tin",
      createdAt: "2026-05-12T10:30:00Z",
      status: "pending",
    },
    {
      id: "2",
      listingId: "3",
      listingTitle: "Phòng ở ghép cho sinh viên nữ",
      reportedBy: "Trần Thị B",
      reason: "Hình ảnh không phù hợp",
      description: "Hình ảnh không đúng với phòng thực tế",
      createdAt: "2026-05-11T15:20:00Z",
      status: "pending",
    },
  ];

  const handleResolve = (id: string) => {
    // TODO: Call API PATCH /api/v1/admin/reports/:id
    console.log("Resolve report:", id);
  };

  const handleDismiss = (id: string) => {
    // TODO: Call API PATCH /api/v1/admin/reports/:id
    console.log("Dismiss report:", id);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Xử lý báo cáo vi phạm</h1>

        <div className="space-y-4">
          {reports.filter((r) => r.status === "pending").map((report) => (
            <div key={report.id} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <Flag className="h-6 w-6 text-red-600" />
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">
                        {report.reason}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Báo cáo bởi <strong>{report.reportedBy}</strong> •{" "}
                        {new Date(report.createdAt).toLocaleString("vi-VN")}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                      Chờ xử lý
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm text-gray-600 mb-1">Tin đăng:</div>
                    <div className="font-semibold text-gray-900">{report.listingTitle}</div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm text-gray-600 mb-1">Nội dung báo cáo:</div>
                    <p className="text-gray-900">{report.description}</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleDismiss(report.id)}
                      className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 flex items-center gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Bỏ qua
                    </button>
                    <button
                      onClick={() => handleResolve(report.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Xử lý & Ẩn tin
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {reports.filter((r) => r.status === "pending").length === 0 && (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <Flag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Không có báo cáo nào
              </h3>
              <p className="text-gray-600">
                Tất cả báo cáo vi phạm đã được xử lý
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
