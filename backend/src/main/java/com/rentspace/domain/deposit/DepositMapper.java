package com.rentspace.domain.deposit;

import com.rentspace.domain.deposit.dto.DepositResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface DepositMapper {

    @Mapping(target = "listingId", source = "listing.id")
    @Mapping(target = "listingTitle", source = "listing.title")
    @Mapping(target = "tenantId", source = "tenant.id")
    @Mapping(target = "landlordId", source = "landlord.id")
    DepositResponse toResponse(DepositTransaction transaction);
}
