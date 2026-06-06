package com.rentspace.domain.review;

import com.rentspace.domain.review.dto.ReviewAuthorResponse;
import com.rentspace.domain.review.dto.ReviewResponse;
import com.rentspace.domain.user.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * Mapper MapStruct chuyển đổi giữa các đối tượng Review và DTOs.
 */
@Mapper(componentModel = "spring")
public interface ReviewMapper {

    @Mapping(target = "listingId", source = "listing.id")
    @Mapping(target = "author", source = "tenant")
    ReviewResponse toResponse(Review review);

    @Mapping(target = "id", source = "id")
    @Mapping(target = "fullName", source = "fullName")
    @Mapping(target = "avatarUrl", source = "avatarUrl")
    ReviewAuthorResponse toAuthorResponse(User user);
}
