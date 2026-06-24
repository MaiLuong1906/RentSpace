package com.rentspace.domain.seo;

import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.domain.seo.dto.SeoPageDto;
import com.rentspace.domain.seo.dto.SeoPageRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SeoPageServiceImpl implements SeoPageService {

    private final SeoPageRepository seoPageRepository;
    private final SeoPageMapper seoPageMapper;

    @Override
    public SeoPageDto getMetadataByPath(String path) {
        return seoPageRepository.findByPath(path)
                .map(seoPageMapper::toDto)
                .orElse(null);
    }

    @Override
    @Transactional
    public SeoPageDto upsertPage(SeoPageRequest request) {
        SeoPage page = seoPageRepository.findByPath(request.getPath())
                .orElseGet(() -> seoPageMapper.toEntity(request));

        seoPageMapper.updateEntity(request, page);
        return seoPageMapper.toDto(seoPageRepository.save(page));
    }

    @Override
    @Transactional
    public void deletePage(Long id) {
        SeoPage page = seoPageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SeoPage không tìm thấy với id: " + id));
        seoPageRepository.delete(page);
    }
}
