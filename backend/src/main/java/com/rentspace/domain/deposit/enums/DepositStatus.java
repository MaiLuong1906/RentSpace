package com.rentspace.domain.deposit.enums;

public enum DepositStatus {
    PENDING_PAYMENT,    // Chờ thanh toán
    PAID,               // Đã thanh toán (Tiền đang được giữ Escrow)
    DISPUTED,           // Đang có tranh chấp
    RELEASED,           // Đã giải ngân cho chủ nhà (Hoàn tất)
    REFUNDED,           // Đã hoàn tiền cho người thuê
    CANCELLED           // Đã hủy (trước khi thanh toán)
}
