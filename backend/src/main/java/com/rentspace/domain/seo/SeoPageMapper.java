package com.rentspace.domain.seo;

import com.rentspace.domain.seo.dto.SeoPageDto;
import com.rentspace.domain.seo.dto.SeoPageRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface SeoPageMapper {

    SeoPageDto toDto(SeoPage entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "lastModified", ignore = true)
    SeoPage toEntity(SeoPageRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "lastModified", ignore = true)
    void updateEntity(SeoPageRequest request, @MappingTarget SeoPage entity);
}
