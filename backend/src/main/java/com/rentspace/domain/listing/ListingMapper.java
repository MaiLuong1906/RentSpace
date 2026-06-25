package com.rentspace.domain.listing;

import com.rentspace.domain.listing.dto.ListingImageResponse;
import com.rentspace.domain.listing.dto.ListingResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * MapStruct mapper cho Listing entity → DTO.
 * Dùng chung cho cả ListingService (LANDLORD) và AdminListingService (ADMIN).
 */
@Mapper(componentModel = "spring")
public interface ListingMapper {

    // Mapping Listing entity → ListingResponse DTO
    @Mapping(source = "landlord.id",        target = "landlordId")
    @Mapping(source = "landlord.fullName",   target = "landlordName")
    @Mapping(source = "landlord.avatarUrl",  target = "landlordAvatar")
    @Mapping(target = "landlordIsVerified",
             expression = "java(listing.getLandlord().getKycStatus() == com.rentspace.domain.user.enums.KycStatus.VERIFIED)")
    @Mapping(target = "averageRating",       ignore = true)
    @Mapping(target = "reviewCount",         ignore = true)
    @Mapping(target = "isPromoted",          ignore = true)
    @Mapping(target = "promotedExpiresAt",   ignore = true)
    ListingResponse toResponse(Listing listing);

    // Mapping ListingImage entity → ListingImageResponse DTO
    ListingImageResponse toImageResponse(ListingImage image);
}
