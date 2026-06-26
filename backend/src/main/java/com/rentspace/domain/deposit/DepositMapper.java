package com.rentspace.domain.deposit;

import com.rentspace.domain.deposit.dto.DepositResponse;
import com.rentspace.domain.deposit.dto.DisputeResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface DepositMapper {

    @Mapping(target = "listingId", source = "listing.id")
    @Mapping(target = "listingTitle", source = "listing.title")
    @Mapping(target = "tenantId", source = "tenant.id")
    @Mapping(target = "tenantName", source = "tenant.fullName")
    @Mapping(target = "landlordId", source = "landlord.id")
    @Mapping(target = "landlordName", source = "landlord.fullName")
    @Mapping(target = "contractUrl", source = "contract.contractUrl")
    @Mapping(target = "contractId", source = "digitalContract.id")
    DepositResponse toResponse(DepositTransaction transaction);

    @Mapping(target = "transactionId", source = "transaction.id")
    @Mapping(target = "openedById", source = "openedBy.id")
    @Mapping(target = "openedByName", source = "openedBy.fullName")
    @Mapping(target = "resolvedById", source = "resolvedBy.id")
    @Mapping(target = "resolvedByName", source = "resolvedBy.fullName")
    DisputeResponse toDisputeResponse(DepositDispute dispute);
}
