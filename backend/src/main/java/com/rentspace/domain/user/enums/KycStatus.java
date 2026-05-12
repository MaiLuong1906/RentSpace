package com.rentspace.domain.user.enums;

public enum KycStatus {
    PENDING,   // Chưa xác thực
    SUBMITTED, // Đã nộp CCCD, chờ duyệt
    VERIFIED,  // Đã xác thực
    REJECTED   // Bị từ chối
}