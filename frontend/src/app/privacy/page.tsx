import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Chính sách bảo mật — RentSpace</h1>
      <div className="prose prose-blue max-w-none">
        <p className="mb-4">RentSpace cam kết bảo vệ thông tin cá nhân của người dùng.</p>
        
        <h2 className="text-xl font-semibold mt-6 mb-3">1. Thông tin thu thập</h2>
        <p className="mb-4">Chúng tôi thu thập email, số điện thoại, và thông tin định danh (KYC) để đảm bảo tính an toàn cho cộng đồng thuê trọ.</p>

        <h2 className="text-xl font-semibold mt-6 mb-3">2. Sử dụng thông tin</h2>
        <p className="mb-4">Thông tin của bạn được sử dụng để xác thực tài khoản, xử lý giao dịch đặt cọc và gợi ý bạn ở ghép phù hợp.</p>

        <h2 className="text-xl font-semibold mt-6 mb-3">3. Bảo mật dữ liệu</h2>
        <p className="mb-4">Dữ liệu được mã hóa và lưu trữ an toàn trên hệ thống. Chúng tôi không chia sẻ thông tin cá nhân của bạn cho bên thứ ba ngoại trừ các đối tác thanh toán (VNPay) khi thực hiện giao dịch.</p>

        <h2 className="text-xl font-semibold mt-6 mb-3">4. Quyền của người dùng</h2>
        <p className="mb-4">Bạn có quyền truy cập, sửa đổi hoặc yêu cầu xóa thông tin cá nhân của mình bất kỳ lúc nào thông qua cài đặt tài khoản.</p>

        <p className="mt-8 text-sm text-gray-500 italic">Cập nhật lần cuối: Tháng 6, 2026</p>
      </div>
    </div>
  );
}
