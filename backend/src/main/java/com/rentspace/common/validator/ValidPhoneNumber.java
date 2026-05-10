package com.rentspace.common.validator;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = PhoneNumberValidator.class)
@Target({ElementType.METHOD, ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidPhoneNumber {
    String message() default "Số điện thoại không hợp lệ (phải là số điện thoại Việt Nam 10 chữ số)";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
