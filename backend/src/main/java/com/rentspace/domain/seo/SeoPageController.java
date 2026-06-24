package com.rentspace.domain.seo;

import com.rentspace.common.response.ApiResponse;
import com.rentspace.domain.seo.dto.SeoPageDto;
import com.rentspace.domain.seo.dto.SeoPageRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Tag(name = "SEO API", description = "Quản lý metadata SEO cho trang thành phố/quận huyện")
public class SeoPageController {

    private final SeoPageService seoPageService;

    /** Public — frontend gọi để lấy title/description cho trang ISR. */
    @GetMapping("/api/v1/seo/pages")
    @Operation(summary = "Lấy SEO metadata theo path URL")
    public ResponseEntity<ApiResponse<SeoPageDto>> getByPath(@RequestParam String path) {
        return ResponseEntity.ok(ApiResponse.success(seoPageService.getMetadataByPath(path)));
    }

    /** Admin — tạo mới hoặc cập nhật metadata. */
    @PostMapping("/api/v1/admin/seo/pages")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Upsert SEO metadata cho một path (Admin)")
    public ResponseEntity<ApiResponse<SeoPageDto>> upsert(
            @Valid @RequestBody SeoPageRequest request) {
        return ResponseEntity.ok(ApiResponse.success(seoPageService.upsertPage(request)));
    }

    /** Admin — xóa một entry. */
    @DeleteMapping("/api/v1/admin/seo/pages/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Xóa SEO metadata theo id (Admin)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        seoPageService.deletePage(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
