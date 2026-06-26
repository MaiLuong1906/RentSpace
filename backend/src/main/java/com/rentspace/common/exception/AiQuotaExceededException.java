package com.rentspace.common.exception;

public class AiQuotaExceededException extends RuntimeException {
    public AiQuotaExceededException(String message) {
        super(message);
    }
}
