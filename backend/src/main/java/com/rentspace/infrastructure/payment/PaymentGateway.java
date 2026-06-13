package com.rentspace.infrastructure.payment;

import java.util.Map;

/**
 * Interface chung cho các cổng thanh toán (VNPay, MoMo, ...).
 */
public interface PaymentGateway {

    /**
     * Tên nhận diện cổng thanh toán (ví dụ: "VNPAY", "MOMO").
     */
    String getGatewayName();

    /**
     * Tạo URL thanh toán.
     *
     * @param amount    Số tiền giao dịch (VND)
     * @param txnRef    Mã tham chiếu giao dịch (đơn hàng)
     * @param orderInfo Thông tin mô tả giao dịch
     * @param ipAddress Địa chỉ IP của khách hàng
     * @return URL chuyển hướng đến cổng thanh toán
     */
    String createPaymentUrl(Long amount, String txnRef, String orderInfo, String ipAddress);

    /**
     * Xác thực chữ ký phản hồi (Webhook/IPN hoặc Return URL) từ cổng thanh toán.
     *
     * @param params Map chứa các tham số nhận được
     * @return true nếu chữ ký hợp lệ, ngược lại false
     */
    boolean verifySignature(Map<String, String> params);
}
