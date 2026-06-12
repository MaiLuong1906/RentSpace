package com.rentspace.domain.listing;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PromotedListingSchedulerTest {

    @Mock
    private PromotedListingRepository promotedListingRepository;

    @InjectMocks
    private PromotedListingScheduler promotedListingScheduler;

    @Test
    @DisplayName("Quét hết hạn - Vô hiệu hóa thành công các tin nổi bật quá hạn")
    @SuppressWarnings("unchecked")
    void deactivateExpiredPromotions_hasExpired() {
        PromotedListing p1 = PromotedListing.builder().id(1L).isActive(true).expiresAt(LocalDateTime.now().minusMinutes(5)).build();
        PromotedListing p2 = PromotedListing.builder().id(2L).isActive(true).expiresAt(LocalDateTime.now().minusMinutes(1)).build();
        List<PromotedListing> expiredList = new ArrayList<>(Arrays.asList(p1, p2));

        when(promotedListingRepository.findAllExpired(any(LocalDateTime.class))).thenReturn(expiredList);

        promotedListingScheduler.deactivateExpiredPromotions();

        assertFalse(p1.getIsActive());
        assertFalse(p2.getIsActive());

        ArgumentCaptor<List<PromotedListing>> captor = ArgumentCaptor.forClass(List.class);
        verify(promotedListingRepository).saveAll(captor.capture());
        
        List<PromotedListing> saved = captor.getValue();
        assertEquals(2, saved.size());
        assertFalse(saved.get(0).getIsActive());
        assertFalse(saved.get(1).getIsActive());
    }

    @Test
    @DisplayName("Quét hết hạn - Không có tin nổi bật nào quá hạn, không lưu DB")
    void deactivateExpiredPromotions_noExpired() {
        when(promotedListingRepository.findAllExpired(any(LocalDateTime.class))).thenReturn(Collections.emptyList());

        promotedListingScheduler.deactivateExpiredPromotions();

        verify(promotedListingRepository, never()).saveAll(anyList());
    }
}
