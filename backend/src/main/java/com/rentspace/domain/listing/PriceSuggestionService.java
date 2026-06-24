package com.rentspace.domain.listing;

import com.rentspace.domain.listing.dto.PriceSuggestionResponse;
import com.rentspace.domain.listing.enums.RoomType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PriceSuggestionService {

    private final PriceBenchmarkRepository priceBenchmarkRepository;

    @Cacheable(value = "priceBenchmarks", key = "#city + ':' + #district + ':' + #roomType + ':' + #area")
    public PriceSuggestionResponse getPriceSuggestion(String city, String district, RoomType roomType, Double area) {
        log.info("Yêu cầu gợi ý giá thuê: city={}, district={}, roomType={}, area={}", city, district, roomType, area);

        String areaBucket = getAreaBucket(area);
        
        // 1. Tìm kiếm theo cụ thể Quận/Huyện
        Optional<PriceBenchmark> benchmarkOpt = priceBenchmarkRepository
                .findByCityAndDistrictAndRoomTypeAndAreaBucket(city, district, roomType, areaBucket);

        if (benchmarkOpt.isPresent()) {
            PriceBenchmark benchmark = benchmarkOpt.get();
            // Nếu số lượng mẫu quá nhỏ (< 3), vẫn thực hiện fallback lên thành phố để tăng tính chính xác
            if (benchmark.getSampleCount() >= 3) {
                return PriceSuggestionResponse.builder()
                        .p25Price(benchmark.getP25Price())
                        .p50Price(benchmark.getP50Price())
                        .p75Price(benchmark.getP75Price())
                        .sampleCount(benchmark.getSampleCount())
                        .dataSource(benchmark.getDataSource().name())
                        .isFallback(false)
                        .build();
            }
            log.info("Dữ liệu quận/huyện {} quá ít (count={}), chuyển sang tìm kiếm fallback cấp thành phố", district, benchmark.getSampleCount());
        }

        // 2. Fallback: Tìm benchmark tốt nhất trong thành phố, loại trừ quận vừa tìm thất bại
        Optional<PriceBenchmark> cityBenchmarkOpt = priceBenchmarkRepository
                .findBestCityFallback(city, roomType, areaBucket, district);

        if (cityBenchmarkOpt.isPresent()) {
            PriceBenchmark cityBenchmark = cityBenchmarkOpt.get();
            return PriceSuggestionResponse.builder()
                    .p25Price(cityBenchmark.getP25Price())
                    .p50Price(cityBenchmark.getP50Price())
                    .p75Price(cityBenchmark.getP75Price())
                    .sampleCount(cityBenchmark.getSampleCount())
                    .dataSource(cityBenchmark.getDataSource().name())
                    .isFallback(true)
                    .build();
        }

        // 3. Fallback mặc định khi cơ sở dữ liệu hoàn toàn trống
        log.info("Không tìm thấy dữ liệu phân vị cho thành phố {}, dùng cấu hình gợi ý mặc định", city);
        return getDefaultSuggestion(roomType);
    }

    private String getAreaBucket(Double area) {
        if (area == null || area <= 0) {
            return "0-20";
        }
        if (area < 20) return "0-20";
        if (area < 30) return "20-30";
        if (area < 50) return "30-50";
        return "50+";
    }

    private PriceSuggestionResponse getDefaultSuggestion(RoomType roomType) {
        long p25, p50, p75;
        switch (roomType) {
            case CHUNG_CU_MINI:
                p25 = 3500000L; p50 = 4800000L; p75 = 6500000L;
                break;
            case CHUNG_CU:
                p25 = 6000000L; p50 = 8500000L; p75 = 12000000L;
                break;
            case NGAN_GIAN:
                p25 = 2000000L; p50 = 3200000L; p75 = 4800000L;
                break;
            case NHA_NGUYEN_CAN:
                p25 = 8000000L; p50 = 12000000L; p75 = 18000000L;
                break;
            case PHONG_TRO:
            default:
                p25 = 1500000L; p50 = 2500000L; p75 = 4000000L;
                break;
        }

        return PriceSuggestionResponse.builder()
                .p25Price(p25)
                .p50Price(p50)
                .p75Price(p75)
                .sampleCount(0)
                .dataSource("DEFAULT")
                .isFallback(true)
                .build();
    }
}
