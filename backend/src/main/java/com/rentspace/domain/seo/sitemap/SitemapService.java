package com.rentspace.domain.seo.sitemap;

import java.util.List;

public interface SitemapService {

    /** Tất cả listing đang ACTIVE, dùng để đưa vào sitemap. */
    List<SitemapUrl> getAllListingUrls();

    /** Trang chủ + các trang thành phố/quận huyện có listing. */
    List<SitemapUrl> getAllAreaUrls();
}
