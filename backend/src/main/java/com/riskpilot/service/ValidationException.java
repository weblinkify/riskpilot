package com.riskpilot.service;

public class ValidationException extends RuntimeException {
    public ValidationException(String message) {
        super(message);
    }
}
