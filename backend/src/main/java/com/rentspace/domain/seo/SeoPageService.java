package com.rentspace.domain.seo;

import com.rentspace.domain.seo.dto.SeoPageDto;
import com.rentspace.domain.seo.dto.SeoPageRequest;

public interface SeoPageService {

    /** Lấy metadata theo path URL, trả null nếu không tìm thấy (frontend tự dùng fallback). */
    SeoPageDto getMetadataByPath(String path);

    /** Admin tạo mới hoặc cập nhật metadata cho một path. */
    SeoPageDto upsertPage(SeoPageRequest request);

    /** Admin xóa một entry theo id. */
    void deletePage(Long id);
}
