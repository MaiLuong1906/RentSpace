package com.rentspace.domain.seo.sitemap;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record SitemapUrl(
        String loc,
        OffsetDateTime lastmod,
        String changefreq,
        BigDecimal priority
) {}
