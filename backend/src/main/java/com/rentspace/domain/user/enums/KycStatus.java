package com.rentspace.domain.user.enums;

public enum KycStatus {
    PENDING, // Chưa xác thực
    SUBMITTED, // Đã nộp CCCD, chờ duyệt
    APPROVED, // Đã xác thực
    REJECTED // Bị từ chối
}
