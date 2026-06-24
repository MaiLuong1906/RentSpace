package com.rentspace.domain.seo.sitemap;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.format.DateTimeFormatter;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequiredArgsConstructor
@Tag(name = "Sitemap API", description = "Cung cấp sitemap.xml cho các search engine")
public class SitemapController {

    private final SitemapService sitemapService;

    @GetMapping(value = "/sitemap.xml", produces = "application/xml")
    @Operation(summary = "Xuất sitemap XML toàn trang (dành cho Google/Bing bot)")
    public ResponseEntity<String> sitemap() {
        List<SitemapUrl> areaUrls = sitemapService.getAllAreaUrls();
        List<SitemapUrl> listingUrls = sitemapService.getAllListingUrls();

        // Loại trùng URL trang khu vực (city có thể lặp từ nhiều quận)
        Set<String> seen = new LinkedHashSet<>();
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");

        for (SitemapUrl url : areaUrls) {
            if (seen.add(url.loc())) {
                appendEntry(xml, url);
            }
        }
        for (SitemapUrl url : listingUrls) {
            appendEntry(xml, url);
        }

        xml.append("</urlset>");
        return ResponseEntity.ok(xml.toString());
    }

    private void appendEntry(StringBuilder xml, SitemapUrl url) {
        xml.append("  <url>\n");
        xml.append("    <loc>").append(escapeXml(url.loc())).append("</loc>\n");
        if (url.lastmod() != null) {
            xml.append("    <lastmod>")
               .append(url.lastmod().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME))
               .append("</lastmod>\n");
        }
        if (url.changefreq() != null) {
            xml.append("    <changefreq>").append(url.changefreq()).append("</changefreq>\n");
        }
        if (url.priority() != null) {
            xml.append("    <priority>").append(url.priority().toPlainString()).append("</priority>\n");
        }
        xml.append("  </url>\n");
    }

    private String escapeXml(String value) {
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }
}
