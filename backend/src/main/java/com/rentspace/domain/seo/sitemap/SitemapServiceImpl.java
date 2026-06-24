package com.rentspace.domain.seo.sitemap;

import com.rentspace.domain.listing.ListingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SitemapServiceImpl implements SitemapService {

    private final ListingRepository listingRepository;

    @Value("${app.site-url:https://rentspace.vn}")
    private String siteUrl;

    @Override
    public List<SitemapUrl> getAllListingUrls() {
        return listingRepository.findAllForSitemap().stream()
                .map(p -> new SitemapUrl(
                        siteUrl + "/phong-tro/" + p.getId(),
                        p.getUpdatedAt() != null
                                ? p.getUpdatedAt().atOffset(ZoneOffset.UTC)
                                : OffsetDateTime.now(ZoneOffset.UTC),
                        "daily",
                        new BigDecimal("0.8")
                ))
                .toList();
    }

    @Override
    public List<SitemapUrl> getAllAreaUrls() {
        List<SitemapUrl> urls = new ArrayList<>();

        // Trang chủ
        urls.add(new SitemapUrl(siteUrl, OffsetDateTime.now(ZoneOffset.UTC), "daily", BigDecimal.ONE));

        // Trang thành phố + quận huyện từ dữ liệu listing thực tế
        List<Object[]> cityDistricts = listingRepository.findDistinctCityDistrict();
        for (Object[] row : cityDistricts) {
            String city = (String) row[0];
            String district = (String) row[1];

            String citySlug = slugify(city);
            // Trang thành phố (thêm 1 lần, sẽ có trùng nhưng Set ở controller lọc lại)
            urls.add(new SitemapUrl(
                    siteUrl + "/tim-phong-tro/" + citySlug,
                    OffsetDateTime.now(ZoneOffset.UTC),
                    "weekly",
                    new BigDecimal("0.7")
            ));

            // Trang quận/huyện
            urls.add(new SitemapUrl(
                    siteUrl + "/tim-phong-tro/" + citySlug + "/" + slugify(district),
                    OffsetDateTime.now(ZoneOffset.UTC),
                    "weekly",
                    new BigDecimal("0.6")
            ));
        }

        return urls;
    }

    private String slugify(String text) {
        if (text == null) return "";
        String normalized = Normalizer.normalize(text, Normalizer.Form.NFD);
        return normalized
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .replace('đ', 'd').replace('Đ', 'd')
                .toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .trim();
    }
}
