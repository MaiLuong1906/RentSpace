package com.rentspace.common.validator;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.regex.Pattern;

public class PhoneNumberValidator implements ConstraintValidator<ValidPhoneNumber, String> {

    // Vietnamese phone number pattern: 10 digits, starts with 03|05|07|08|09
    private static final Pattern PHONE_PATTERN = Pattern.compile("^(03|05|07|08|09)[0-9]{8}$");

    @Override
    public boolean isValid(String phoneNumber, ConstraintValidatorContext context) {
        if (phoneNumber == null || phoneNumber.isEmpty()) {
            return true; // Allow null — use @NotBlank separately if required
        }
        return PHONE_PATTERN.matcher(phoneNumber).matches();
    }
}
