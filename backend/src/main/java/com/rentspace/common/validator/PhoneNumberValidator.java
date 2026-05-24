package com.rentspace.common.validator;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.regex.Pattern;

public class PhoneNumberValidator implements ConstraintValidator<ValidPhoneNumber, String> {

    // Vietnamese phone number pattern: supports local 0 and international +84 starting digits
    private static final Pattern PHONE_PATTERN = Pattern.compile("^(\\+84|0)[3-9]\\d{8}$");

    @Override
    public boolean isValid(String phoneNumber, ConstraintValidatorContext context) {
        if (phoneNumber == null || phoneNumber.isEmpty()) {
            return true; // Allow null — use @NotBlank separately if required
        }
        return PHONE_PATTERN.matcher(phoneNumber).matches();
    }
}
