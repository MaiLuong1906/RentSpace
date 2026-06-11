package com.rentspace.domain.kyc;

import com.rentspace.domain.kyc.dto.KycReviewItem;
import com.rentspace.domain.user.User;
import com.rentspace.infrastructure.storage.StorageService;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.beans.factory.annotation.Autowired;

@Mapper(componentModel = "spring")
public abstract class KycMapper {

    @Autowired
    protected StorageService storageService;

    @Mapping(target = "userId", source = "id")
    @Mapping(target = "kycStatus", expression = "java(user.getKycStatus().name())")
    @Mapping(target = "cccdImageUrl", expression = "java(user.getCccdImageUrl() != null ? storageService.getPresignedUrl(user.getCccdImageUrl()) : null)")
    @Mapping(target = "submittedAt", source = "updatedAt")
    public abstract KycReviewItem toReviewItem(User user);
}
