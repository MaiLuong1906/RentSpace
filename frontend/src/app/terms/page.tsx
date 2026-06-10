import React from 'react';

export default function TermsPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Điều khoản sử dụng — RentSpace</h1>
      <div className="prose prose-blue max-w-none">
        <p className="mb-4">Chào mừng bạn đến với RentSpace. Bằng việc sử dụng dịch vụ của chúng tôi, bạn đồng ý với các điều khoản dưới đây.</p>
        
        <h2 className="text-xl font-semibold mt-6 mb-3">1. Tài khoản người dùng</h2>
        <p className="mb-4">Bạn phải cung cấp thông tin chính xác khi đăng ký tài khoản và chịu trách nhiệm bảo mật mật khẩu của mình.</p>

        <h2 className="text-xl font-semibold mt-6 mb-3">2. Đăng tin và Thuê phòng</h2>
        <p className="mb-4">Chủ nhà cam kết thông tin phòng trọ là chính xác. Người thuê cam kết tuân thủ quy trình đặt cọc an toàn của hệ thống.</p>

        <h2 className="text-xl font-semibold mt-6 mb-3">3. Thanh toán và Đặt cọc (Escrow)</h2>
        <p className="mb-4">RentSpace cung cấp dịch vụ giữ tiền đặt cọc trung gian. Tiền sẽ được giải ngân cho chủ nhà sau khi người thuê xác nhận nhận phòng hoặc sau thời hạn quy định nếu không có tranh chấp.</p>

        <h2 className="text-xl font-semibold mt-6 mb-3">4. Giải quyết tranh chấp</h2>
        <p className="mb-4">Mọi tranh chấp phát sinh trong quá trình đặt cọc sẽ được RentSpace hỗ trợ hòa giải dựa trên bằng chứng cung cấp bởi hai bên.</p>

        <p className="mt-8 text-sm text-gray-500 italic">Cập nhật lần cuối: Tháng 6, 2026</p>
      </div>
    </div>
  );
}
