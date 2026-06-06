package com.rentspace.domain.listing.enums;

public enum ListingStatus {
    DRAFT,      // Bản nháp, chưa đăng
    PENDING,    // Chờ duyệt
    ACTIVE,     // Đang cho thuê, hiển thị công khai
    REJECTED,   // Bị từ chối duyệt
    RENTED,     // Đã có người thuê
    INACTIVE,   // Chủ trọ tạm ẩn tin
    DELETED     // Soft delete
}
