package com.rentspace.domain.subscription;

import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.common.exception.SubscriptionLimitExceededException;
import com.rentspace.domain.listing.ListingRepository;
import com.rentspace.domain.listing.enums.ListingStatus;
import com.rentspace.domain.subscription.enums.PlanName;
import com.rentspace.domain.subscription.enums.SubscriptionStatus;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.stereotype.Component;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class SubscriptionLimitAspect {

    private final ListingRepository listingRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final UserRepository userRepository;
    private final SubscriptionService subscriptionService;

    @Before("@annotation(com.rentspace.domain.subscription.annotation.EnforceSubscriptionLimit)")
    public void checkListingLimit(JoinPoint joinPoint) {
        Object[] args = joinPoint.getArgs();
        if (args.length == 0 || !(args[0] instanceof String)) {
            log.warn("EnforceSubscriptionLimit aspect applied to method without email as first argument");
            return;
        }
        String email = (String) args[0];
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại: " + email));

        // 1. Tìm gói cước đang hoạt động của Landlord (Tự động tạo gói FREE nếu chưa có)
        UserSubscription activeSub = userSubscriptionRepository
                .findFirstByUserIdAndStatusOrderByStartedAtDesc(user.getId(), SubscriptionStatus.ACTIVE)
                .orElseGet(() -> subscriptionService.getOrCreateDefaultFreeSubscription(user));

        SubscriptionPlan plan = activeSub.getPlan();

        // 2. Đếm số tin đăng active hiện tại của Landlord
        long activeListingCount;
        if (plan.getName() == PlanName.FREE) {
            activeListingCount = listingRepository.countByLandlordIdAndStatusNot(user.getId(), ListingStatus.DELETED);
        } else {
            java.time.LocalDateTime cycleStart = subscriptionService.getCurrentCycleStartDate(activeSub.getStartedAt());
            activeListingCount = listingRepository.countByLandlordIdAndStatusNotAndCreatedAtGreaterThanEqual(
                    user.getId(), ListingStatus.DELETED, cycleStart);
        }

        log.info("Checking listing limit for user {}: current active listings = {}, max allowed = {}", 
                email, activeListingCount, plan.getMaxListings());

        // 3. So sánh với giới hạn gói cước
        if (activeListingCount >= plan.getMaxListings()) {
            throw new SubscriptionLimitExceededException(
                String.format("Bạn đã đạt tới giới hạn đăng tin tối đa của gói %s (%d/%d tin). Vui lòng nâng cấp gói cước để tiếp tục đăng tin.",
                    plan.getDisplayName(), activeListingCount, plan.getMaxListings())
            );
        }
    }
}
