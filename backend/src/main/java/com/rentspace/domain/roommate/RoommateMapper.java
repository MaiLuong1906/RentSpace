package com.rentspace.domain.roommate;

import com.rentspace.domain.user.User;
import com.rentspace.domain.user.enums.KycStatus;
import com.rentspace.domain.roommate.enums.MatchStatus;
import com.rentspace.domain.roommate.dto.RoommateMatchResponse;
import com.rentspace.domain.roommate.dto.RoommateProfileRequest;
import com.rentspace.domain.roommate.dto.RoommateProfileResponse;
import com.rentspace.infrastructure.storage.StorageService;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.springframework.beans.factory.annotation.Autowired;

@Mapper(componentModel = "spring")
public abstract class RoommateMapper {

    @Autowired
    protected StorageService storageService;

    @Mapping(target = "userId",      source = "user.id")
    @Mapping(target = "fullName",    source = "user.fullName")
    @Mapping(target = "avatar",      expression = "java(profile.getUser().getAvatarUrl() != null ? storageService.getPresignedUrl(profile.getUser().getAvatarUrl()) : null)")
    @Mapping(target = "kycStatus",   expression = "java(profile.getUser().getKycStatus() != null ? profile.getUser().getKycStatus().name() : null)")
    @Mapping(target = "profileType", expression = "java(profile.getProfileType() != null ? profile.getProfileType().name() : null)")
    public abstract RoommateProfileResponse toResponse(RoommateProfile profile);

    @Mapping(target = "id",               ignore = true)
    @Mapping(target = "user",             ignore = true)
    @Mapping(target = "createdAt",        ignore = true)
    @Mapping(target = "updatedAt",        ignore = true)
    public abstract RoommateProfile toEntity(RoommateProfileRequest request);

    @Mapping(target = "id",               ignore = true)
    @Mapping(target = "user",             ignore = true)
    @Mapping(target = "createdAt",        ignore = true)
    @Mapping(target = "updatedAt",        ignore = true)
    public abstract void updateEntityFromRequest(RoommateProfileRequest request, @MappingTarget RoommateProfile profile);

    @Mapping(target = "status",            expression = "java(match.getStatus() != null ? match.getStatus().name() : null)")
    @Mapping(target = "profileAInterested", source = "profileAInterested")
    @Mapping(target = "profileBInterested", source = "profileBInterested")
    public abstract RoommateMatchResponse toResponse(RoommateMatch match);
}
