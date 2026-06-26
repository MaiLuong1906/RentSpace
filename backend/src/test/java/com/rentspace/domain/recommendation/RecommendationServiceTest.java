package com.rentspace.domain.recommendation;

import com.rentspace.domain.interaction.InteractionRepository;
import com.rentspace.domain.interaction.InteractionType;
import com.rentspace.domain.interaction.UserListingInteraction;
import com.rentspace.domain.listing.Listing;
import com.rentspace.domain.listing.ListingRepository;
import com.rentspace.domain.listing.enums.ListingStatus;
import com.rentspace.domain.listing.enums.RoomType;
import com.rentspace.domain.recommendation.dto.ListingSummaryDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RecommendationServiceTest {

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private InteractionRepository interactionRepository;

    @InjectMocks
    private RecommendationServiceImpl recommendationService;

    private Listing sampleListing;

    @BeforeEach
    void setUp() {
        sampleListing = Listing.builder()
                .id(1L)
                .title("Phòng trọ trung tâm Đà Nẵng")
                .city("Đà Nẵng")
                .district("Hải Châu")
                .pricePerMonth(new BigDecimal("3000000"))
                .areaM2(new BigDecimal("20"))
                .roomType(RoomType.PHONG_TRO)
                .status(ListingStatus.ACTIVE)
                .images(new ArrayList<>())
                .build();
    }

    // ===== getSimilarListings — cold start (CF trống → content-based) =====

    @Test
    void getSimilarListings_coldStart_fallsBackToContentBased() {
        Listing similar = Listing.builder()
                .id(2L)
                .title("Phòng trọ Hải Châu")
                .city("Đà Nẵng")
                .district("Hải Châu")
                .pricePerMonth(new BigDecimal("2800000"))
                .areaM2(new BigDecimal("18"))
                .roomType(RoomType.PHONG_TRO)
                .status(ListingStatus.ACTIVE)
                .images(new ArrayList<>())
                .build();

        when(interactionRepository.findCoViewedListings(eq(1L), any(Instant.class), eq(6)))
                .thenReturn(Collections.emptyList());
        when(listingRepository.findById(1L)).thenReturn(Optional.of(sampleListing));
        when(listingRepository.findSimilarByContent(any(), any(), any(), any(), any(), any(), eq(1L), eq(6)))
                .thenReturn(List.of(2L));
        when(listingRepository.findByIdInWithImages(List.of(2L)))
                .thenReturn(List.of(similar));

        List<ListingSummaryDto> result = recommendationService.getSimilarListings(1L, 6);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(2L);
        assertThat(result.get(0).getDistrict()).isEqualTo("Hải Châu");
    }

    // ===== getSimilarListings — đủ CF data → CF wins =====

    @Test
    void getSimilarListings_withEnoughCfData_returnsCfResults() {
        // Tạo 4 kết quả CF (>= limit/2 = 3 với limit=6)
        List<Object[]> cfRaw = List.of(
                new Object[]{2L, 10L},
                new Object[]{3L, 8L},
                new Object[]{4L, 6L},
                new Object[]{5L, 4L}
        );
        List<Listing> cfListings = List.of(
                buildListing(2L, "Phòng B"), buildListing(3L, "Phòng C"),
                buildListing(4L, "Phòng D"), buildListing(5L, "Phòng E")
        );

        when(interactionRepository.findCoViewedListings(eq(1L), any(Instant.class), eq(6)))
                .thenReturn(cfRaw);
        when(listingRepository.findByIdInWithImages(List.of(2L, 3L, 4L, 5L)))
                .thenReturn(cfListings);

        List<ListingSummaryDto> result = recommendationService.getSimilarListings(1L, 6);

        assertThat(result).hasSize(4);
        assertThat(result.get(0).getId()).isEqualTo(2L);
    }

    // ===== getSimilarListings — listing không tồn tại =====

    @Test
    void getSimilarListings_listingNotFound_returnsEmpty() {
        when(interactionRepository.findCoViewedListings(eq(99L), any(Instant.class), eq(6)))
                .thenReturn(Collections.emptyList());
        when(listingRepository.findById(99L)).thenReturn(Optional.empty());

        List<ListingSummaryDto> result = recommendationService.getSimilarListings(99L, 6);

        assertThat(result).isEmpty();
    }

    // ===== getForYou — user có lịch sử → personalized =====

    @Test
    void getForYou_withUserHistory_returnsPersonalizedResults() {
        UserListingInteraction recentView = UserListingInteraction.builder()
                .userId(10L)
                .listingId(1L)
                .interactionType(InteractionType.VIEW)
                .createdAt(Instant.now())
                .build();

        List<Object[]> personalizedRaw = List.of(
                new Object[]{3L, 15L},
                new Object[]{4L, 10L}
        );
        List<Listing> personalizedListings = List.of(
                buildListing(3L, "Phòng C"), buildListing(4L, "Phòng D")
        );

        when(interactionRepository.findRecentByUser(eq(10L), any(Instant.class)))
                .thenReturn(List.of(recentView));
        when(interactionRepository.findForUser(eq(10L), eq(List.of(1L)), any(Instant.class), eq(12)))
                .thenReturn(personalizedRaw);
        when(listingRepository.findByIdInWithImages(List.of(3L, 4L)))
                .thenReturn(personalizedListings);

        List<ListingSummaryDto> result = recommendationService.getForYou(10L, 12);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getId()).isEqualTo(3L);
    }

    // ===== getForYou — không có lịch sử → fill bằng trending =====

    @Test
    void getForYou_withoutHistory_fillsWithTrending() {
        List<Object[]> trendingRaw = List.of(
                new Object[]{5L, 20L},
                new Object[]{6L, 15L}
        );
        List<Listing> trendingListings = List.of(
                buildListing(5L, "Phòng E"), buildListing(6L, "Phòng F")
        );

        when(interactionRepository.findRecentByUser(eq(20L), any(Instant.class)))
                .thenReturn(Collections.emptyList());
        when(interactionRepository.findForUser(eq(20L), eq(List.of(-1L)), any(Instant.class), eq(12)))
                .thenReturn(Collections.emptyList());
        when(interactionRepository.findTrending(any(Instant.class), eq(12)))
                .thenReturn(trendingRaw);
        when(listingRepository.findByIdInWithImages(anyList()))
                .thenReturn(trendingListings);

        List<ListingSummaryDto> result = recommendationService.getForYou(20L, 12);

        assertThat(result).hasSize(2);
    }

    // ===== getTrending =====

    @Test
    void getTrending_returnsTopListingsByInteractionCount() {
        List<Object[]> trendingRaw = List.of(
                new Object[]{7L, 50L},
                new Object[]{8L, 30L}
        );
        List<Listing> trendingListings = List.of(
                buildListing(7L, "Phòng hot A"), buildListing(8L, "Phòng hot B")
        );

        when(interactionRepository.findTrending(any(Instant.class), eq(12)))
                .thenReturn(trendingRaw);
        when(listingRepository.findByIdInWithImages(List.of(7L, 8L)))
                .thenReturn(trendingListings);

        List<ListingSummaryDto> result = recommendationService.getTrending(12);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getId()).isEqualTo(7L);
        assertThat(result.get(1).getId()).isEqualTo(8L);
    }

    // ===== getTrending — không có data =====

    @Test
    void getTrending_noInteractionData_returnsEmpty() {
        when(interactionRepository.findTrending(any(Instant.class), eq(12)))
                .thenReturn(Collections.emptyList());

        List<ListingSummaryDto> result = recommendationService.getTrending(12);

        assertThat(result).isEmpty();
    }

    private Listing buildListing(Long id, String title) {
        return Listing.builder()
                .id(id)
                .title(title)
                .city("Đà Nẵng")
                .district("Hải Châu")
                .pricePerMonth(new BigDecimal("3000000"))
                .areaM2(new BigDecimal("20"))
                .roomType(RoomType.PHONG_TRO)
                .status(ListingStatus.ACTIVE)
                .images(new ArrayList<>())
                .build();
    }
}
