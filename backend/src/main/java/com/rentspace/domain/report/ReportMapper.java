package com.rentspace.domain.report;

import com.rentspace.domain.report.dto.ReportResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * Mapper MapStruct chuyển đổi giữa các đối tượng Report và DTOs.
 */
@Mapper(componentModel = "spring")
public interface ReportMapper {

    @Mapping(target = "listingId", source = "listing.id")
    @Mapping(target = "listingTitle", source = "listing.title")
    @Mapping(target = "reporterId", source = "reporter.id")
    @Mapping(target = "reporterName", source = "reporter.fullName")
    ReportResponse toResponse(Report report);
}
