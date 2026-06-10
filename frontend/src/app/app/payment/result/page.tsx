import React from 'react';
import Link from 'next/link';

export default function PaymentResultPage() {
  return (
    <div className="container mx-auto py-20 px-4 text-center">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <h1 className="text-2xl font-bold mb-4">Kết quả thanh toán</h1>
        <p className="text-gray-600 mb-8">
          Hệ thống đang xử lý kết quả thanh toán từ VNPay. Vui lòng kiểm tra lại trạng thái giao dịch trong giây lát.
        </p>
        <Link 
          href="/app/deposits"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Quay lại danh sách đặt cọc
        </Link>
      </div>
    </div>
  );
}
