package com.rentspace.domain.listing;

import com.rentspace.domain.listing.dto.PriceSuggestionResponse;
import com.rentspace.domain.listing.enums.BenchmarkDataSource;
import com.rentspace.domain.listing.enums.RoomType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PriceSuggestionServiceTest {

    @Mock
    private PriceBenchmarkRepository priceBenchmarkRepository;

    @InjectMocks
    private PriceSuggestionService priceSuggestionService;

    private PriceBenchmark mockBenchmark;
    private PriceBenchmark mockCityFallbackBenchmark;

    @BeforeEach
    void setUp() {
        mockBenchmark = PriceBenchmark.builder()
                .city("Đà Nẵng")
                .district("Hải Châu")
                .roomType(RoomType.PHONG_TRO)
                .areaBucket("20-30")
                .p25Price(1800000L)
                .p50Price(2500000L)
                .p75Price(3200000L)
                .sampleCount(5)
                .dataSource(BenchmarkDataSource.LISTING)
                .build();

        mockCityFallbackBenchmark = PriceBenchmark.builder()
                .city("Đà Nẵng")
                .district("")
                .roomType(RoomType.PHONG_TRO)
                .areaBucket("20-30")
                .p25Price(2000000L)
                .p50Price(2800000L)
                .p75Price(3500000L)
                .sampleCount(20)
                .dataSource(BenchmarkDataSource.LISTING)
                .build();
    }

    @Test
    void getPriceSuggestion_whenExactMatchExistsAndSampleCountIsEnough_returnsExactMatch() {
        // given
        when(priceBenchmarkRepository.findByCityAndDistrictAndRoomTypeAndAreaBucket(
                "Đà Nẵng", "Hải Châu", RoomType.PHONG_TRO, "20-30"))
                .thenReturn(Optional.of(mockBenchmark));

        // when
        PriceSuggestionResponse response = priceSuggestionService.getPriceSuggestion(
                "Đà Nẵng", "Hải Châu", RoomType.PHONG_TRO, 25.0);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getIsFallback()).isFalse();
        assertThat(response.getP50Price()).isEqualTo(2500000L);
        assertThat(response.getSampleCount()).isEqualTo(5);
        verify(priceBenchmarkRepository, never()).findBestCityFallback(any(), any(), any(), any());
    }

    @Test
    void getPriceSuggestion_whenExactMatchExistsButSampleCountIsTooLow_fallsBackToCity() {
        // given
        mockBenchmark.setSampleCount(2); // Dưới 3
        when(priceBenchmarkRepository.findByCityAndDistrictAndRoomTypeAndAreaBucket(
                "Đà Nẵng", "Hải Châu", RoomType.PHONG_TRO, "20-30"))
                .thenReturn(Optional.of(mockBenchmark));
        when(priceBenchmarkRepository.findBestCityFallback(
                "Đà Nẵng", RoomType.PHONG_TRO, "20-30", "Hải Châu"))
                .thenReturn(Optional.of(mockCityFallbackBenchmark));

        // when
        PriceSuggestionResponse response = priceSuggestionService.getPriceSuggestion(
                "Đà Nẵng", "Hải Châu", RoomType.PHONG_TRO, 25.0);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getIsFallback()).isTrue();
        assertThat(response.getP50Price()).isEqualTo(2800000L);
        assertThat(response.getSampleCount()).isEqualTo(20);
    }

    @Test
    void getPriceSuggestion_whenNoMatchExists_fallsBackToCity() {
        // given
        when(priceBenchmarkRepository.findByCityAndDistrictAndRoomTypeAndAreaBucket(
                "Đà Nẵng", "Hải Châu", RoomType.PHONG_TRO, "20-30"))
                .thenReturn(Optional.empty());
        when(priceBenchmarkRepository.findBestCityFallback(
                "Đà Nẵng", RoomType.PHONG_TRO, "20-30", "Hải Châu"))
                .thenReturn(Optional.of(mockCityFallbackBenchmark));

        // when
        PriceSuggestionResponse response = priceSuggestionService.getPriceSuggestion(
                "Đà Nẵng", "Hải Châu", RoomType.PHONG_TRO, 25.0);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getIsFallback()).isTrue();
        assertThat(response.getP50Price()).isEqualTo(2800000L);
    }

    @Test
    void getPriceSuggestion_whenCityBenchmarkAlsoEmpty_returnsDefaultValues() {
        // given
        when(priceBenchmarkRepository.findByCityAndDistrictAndRoomTypeAndAreaBucket(
                "Đà Nẵng", "Hải Châu", RoomType.PHONG_TRO, "20-30"))
                .thenReturn(Optional.empty());
        when(priceBenchmarkRepository.findBestCityFallback(
                "Đà Nẵng", RoomType.PHONG_TRO, "20-30", "Hải Châu"))
                .thenReturn(Optional.empty());

        // when
        PriceSuggestionResponse response = priceSuggestionService.getPriceSuggestion(
                "Đà Nẵng", "Hải Châu", RoomType.PHONG_TRO, 25.0);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getIsFallback()).isTrue();
        assertThat(response.getP25Price()).isEqualTo(1500000L); // mặc định PHONG_TRO
        assertThat(response.getP50Price()).isEqualTo(2500000L);
        assertThat(response.getP75Price()).isEqualTo(4000000L);
        assertThat(response.getSampleCount()).isZero();
        assertThat(response.getDataSource()).isEqualTo("DEFAULT");
    }
}
