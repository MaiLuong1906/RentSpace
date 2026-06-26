package com.rentspace.domain.interaction;

import com.rentspace.domain.interaction.dto.SaveToggleResponse;
import com.rentspace.domain.listing.dto.ListingResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface SavedListingService {

    /**
     * Toggle save/unsave listing. Trả về trạng thái mới và tổng số lượt save.
     */
    SaveToggleResponse toggleSave(Long userId, Long listingId);

    /**
     * Lấy danh sách tin đã lưu của user (phân trang, mới nhất trước).
     */
    Page<ListingResponse> getSavedListings(Long userId, Pageable pageable);

    /**
     * Kiểm tra user có đang save listing này không.
     */
    boolean isSaved(Long userId, Long listingId);
}
