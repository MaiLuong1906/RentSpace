import Link from "next/link";
import { PlusCircle, Edit, Eye, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { mockListings, formatPrice, getRoomTypeLabel } from "@/lib/mockData";

export default function MyListingsPage() {
  // Mock: Filter listings by current landlord
  const myListings = mockListings.filter((l) => l.landlordId === "landlord1");

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Quản lý tin đăng</h1>
            <p className="text-gray-600 mt-2">
              Bạn đang có <strong>{myListings.length}</strong> tin đăng
            </p>
          </div>

          <Link
            href="/app/landlord/create-listing"
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            <PlusCircle className="h-5 w-5" />
            Đăng tin mới
          </Link>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">Tổng tin đăng</div>
            <div className="text-2xl font-bold text-gray-900">{myListings.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">Đang hiển thị</div>
            <div className="text-2xl font-bold text-green-600">
              {myListings.filter((l) => l.status === "available").length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">Đã cho thuê</div>
            <div className="text-2xl font-bold text-blue-600">
              {myListings.filter((l) => l.status === "rented").length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">Lượt xem</div>
            <div className="text-2xl font-bold text-purple-600">
              {myListings.reduce((sum, l) => sum + l.reviewCount * 10, 0)}
            </div>
          </div>
        </div>

        {/* Listings Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tin đăng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đánh giá
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {myListings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div>
                          <div className="font-semibold text-gray-900 line-clamp-1">
                            {listing.title}
                          </div>
                          <div className="text-sm text-gray-600">
                            {listing.district} • {listing.area}m² • {getRoomTypeLabel(listing.roomType)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-blue-600">
                        {formatPrice(listing.price)}
                      </div>
                      <div className="text-xs text-gray-500">/tháng</div>
                    </td>
                    <td className="px-6 py-4">
                      {listing.status === "available" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Còn trống
                        </span>
                      ) : listing.status === "rented" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Đã cho thuê
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Chờ duyệt
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        <span className="font-semibold">{listing.rating}</span>
                        <span className="text-gray-500 text-sm">({listing.reviewCount})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/app/listings/${listing.id}`}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Chỉnh sửa"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Đổi trạng thái"
                        >
                          {listing.status === "available" ? (
                            <ToggleRight className="h-4 w-4" />
                          ) : (
                            <ToggleLeft className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {myListings.length === 0 && (
            <div className="text-center py-12">
              <PlusCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Chưa có tin đăng nào
              </h3>
              <p className="text-gray-600 mb-6">
                Bắt đầu đăng tin để cho thuê phòng trọ của bạn
              </p>
              <Link
                href="/app/landlord/create-listing"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
              >
                <PlusCircle className="h-5 w-5" />
                Đăng tin đầu tiên
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
