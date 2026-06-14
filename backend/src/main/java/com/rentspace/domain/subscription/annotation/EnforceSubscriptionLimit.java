package com.rentspace.domain.subscription.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation dùng để kiểm soát giới hạn đăng tin của chủ nhà dựa trên gói cước hiện tại.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface EnforceSubscriptionLimit {
}
