package com.rentspace.domain.listing.enums;

public enum ListingStatus {
    DRAFT,      // Bản nháp, chưa đăng
    ACTIVE,     // Đang cho thuê, hiển thị công khai
    RENTED,     // Đã có người thuê
    INACTIVE,   // Chủ trọ tạm ẩn tin
    DELETED     // Soft delete
}
