package com.rentspace.domain.recommendation;

import com.rentspace.domain.interaction.InteractionRepository;
import com.rentspace.domain.interaction.UserListingInteraction;
import com.rentspace.domain.listing.Listing;
import com.rentspace.domain.listing.ListingRepository;
import com.rentspace.domain.recommendation.dto.ListingSummaryDto;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RecommendationServiceImpl implements RecommendationService {

    private final ListingRepository listingRepository;
    private final InteractionRepository interactionRepository;

    private static final int CF_MIN_RESULTS_RATIO = 2;
    private static final long CF_WINDOW_DAYS = 90;
    private static final long RECENTLY_VIEWED_DAYS = 7;
    private static final long TRENDING_WINDOW_DAYS = 7;

    @Override
    @Cacheable(value = "similarListings", key = "#listingId + '-' + #limit")
    public List<ListingSummaryDto> getSimilarListings(Long listingId, int limit) {
        Instant since = Instant.now().minus(CF_WINDOW_DAYS, ChronoUnit.DAYS);
        List<Object[]> cfRaw = interactionRepository.findCoViewedListings(listingId, since, limit);
        List<Long> cfIds = extractIds(cfRaw);

        List<Long> finalIds;
        if (cfIds.size() >= limit / CF_MIN_RESULTS_RATIO) {
            finalIds = cfIds;
        } else {
            Listing listing = listingRepository.findById(listingId).orElse(null);
            if (listing == null) {
                return List.of();
            }
            BigDecimal price = listing.getPricePerMonth();
            BigDecimal minPrice = price.multiply(BigDecimal.valueOf(0.7));
            BigDecimal maxPrice = price.multiply(BigDecimal.valueOf(1.3));

            List<Long> contentIds = listingRepository.findSimilarByContent(
                    listing.getCity(),
                    listing.getDistrict(),
                    listing.getRoomType().name(),
                    minPrice,
                    maxPrice,
                    price,
                    listingId,
                    limit
            );

            // CF results trước, content-based fill phần còn lại, loại trùng
            LinkedHashSet<Long> merged = new LinkedHashSet<>(cfIds);
            merged.addAll(contentIds);
            finalIds = merged.stream().limit(limit).collect(Collectors.toList());
        }

        return loadSummaries(finalIds);
    }

    @Override
    @Cacheable(value = "forYou", key = "#userId + '-' + #limit")
    public List<ListingSummaryDto> getForYou(Long userId, int limit) {
        Instant recentWindow = Instant.now().minus(RECENTLY_VIEWED_DAYS, ChronoUnit.DAYS);
        List<Long> recentlyViewedIds = interactionRepository
                .findRecentByUser(userId, recentWindow)
                .stream()
                .map(UserListingInteraction::getListingId)
                .distinct()
                .collect(Collectors.toList());

        // NOT IN yêu cầu ít nhất 1 phần tử trong PostgreSQL
        List<Long> excludedIds = recentlyViewedIds.isEmpty()
                ? Collections.singletonList(-1L)
                : recentlyViewedIds;

        Instant historyWindow = Instant.now().minus(CF_WINDOW_DAYS, ChronoUnit.DAYS);
        List<Object[]> personalizedRaw = interactionRepository.findForUser(
                userId, excludedIds, historyWindow, limit);
        List<Long> personalizedIds = extractIds(personalizedRaw);

        if (personalizedIds.size() < limit) {
            List<Object[]> trendingRaw = interactionRepository.findTrending(
                    Instant.now().minus(TRENDING_WINDOW_DAYS, ChronoUnit.DAYS),
                    limit - personalizedIds.size()
            );
            LinkedHashSet<Long> merged = new LinkedHashSet<>(personalizedIds);
            merged.addAll(extractIds(trendingRaw));
            personalizedIds = merged.stream().limit(limit).collect(Collectors.toList());
        }

        return loadSummaries(personalizedIds);
    }

    @Override
    @Cacheable(value = "trending", key = "#limit")
    public List<ListingSummaryDto> getTrending(int limit) {
        Instant since = Instant.now().minus(TRENDING_WINDOW_DAYS, ChronoUnit.DAYS);
        List<Object[]> raw = interactionRepository.findTrending(since, limit);
        return loadSummaries(extractIds(raw));
    }

    // Trích listing_id từ Object[] trả về của native query
    private List<Long> extractIds(List<Object[]> rows) {
        return rows.stream()
                .map(row -> ((Number) row[0]).longValue())
                .collect(Collectors.toList());
    }

    // Load listings với ảnh, giữ thứ tự theo danh sách IDs từ recommendation engine
    private List<ListingSummaryDto> loadSummaries(List<Long> ids) {
        if (ids.isEmpty()) {
            return List.of();
        }
        List<Listing> listings = listingRepository.findByIdInWithImages(ids);
        Map<Long, Listing> byId = listings.stream()
                .collect(Collectors.toMap(Listing::getId, l -> l));

        return ids.stream()
                .map(byId::get)
                .filter(Objects::nonNull)
                .map(this::toSummary)
                .collect(Collectors.toList());
    }

    private ListingSummaryDto toSummary(Listing listing) {
        String thumbnail = listing.getImages().stream()
                .min(Comparator.comparingInt(img -> img.getDisplayOrder() != null ? img.getDisplayOrder() : 0))
                .map(img -> img.getImageUrl())
                .orElse(null);

        return ListingSummaryDto.builder()
                .id(listing.getId())
                .title(listing.getTitle())
                .district(listing.getDistrict())
                .city(listing.getCity())
                .pricePerMonth(listing.getPricePerMonth())
                .areaM2(listing.getAreaM2())
                .roomType(listing.getRoomType())
                .thumbnail(thumbnail)
                .build();
    }
}
