package com.rentspace.domain.listing;

import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.domain.listing.dto.ListingResponse;
import com.rentspace.domain.listing.enums.ListingStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AdminListingService {

    private final ListingRepository listingRepository;
    private final ListingMapper listingMapper;

    // ===== [ADMIN] GET tất cả listing (mọi status trừ DELETED nếu status=null) =====
    public Page<ListingResponse> getAllListings(ListingStatus status, Pageable pageable) {
        if (status != null) {
            // Lọc theo status cụ thể (bao gồm cả DELETED nếu admin muốn xem)
            return listingRepository.findByStatus(status, pageable)
                    .map(listingMapper::toResponse);
        }
        // Mặc định: lấy tất cả trừ DELETED
        return listingRepository.findByStatusNot(ListingStatus.DELETED, pageable)
                .map(listingMapper::toResponse);
    }

    // ===== [ADMIN] Cập nhật status của bất kỳ listing nào =====
    @Transactional
    public ListingResponse updateStatus(Long id, ListingStatus newStatus) {
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tin đăng với id: " + id));

        ListingStatus oldStatus = listing.getStatus();
        listing.setStatus(newStatus);
        Listing saved = listingRepository.save(listing);

        log.info("[ADMIN] Cập nhật trạng thái tin đăng id={} từ {} → {}", id, oldStatus, newStatus);
        return listingMapper.toResponse(saved);
    }
}
