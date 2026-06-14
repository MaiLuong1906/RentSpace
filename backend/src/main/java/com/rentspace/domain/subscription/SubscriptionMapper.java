package com.rentspace.domain.subscription;

import com.rentspace.domain.subscription.dto.SubscriptionPlanResponse;
import com.rentspace.domain.subscription.dto.UserSubscriptionResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface SubscriptionMapper {

    SubscriptionPlanResponse toResponse(SubscriptionPlan plan);

    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "userEmail", source = "user.email")
    @Mapping(target = "plan", source = "plan")
    UserSubscriptionResponse.UserSubscriptionDetailResponse toDetailResponse(UserSubscription userSubscription);
}
