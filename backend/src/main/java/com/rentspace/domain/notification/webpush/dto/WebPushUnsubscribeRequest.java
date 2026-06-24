package com.rentspace.domain.notification.webpush.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WebPushUnsubscribeRequest {

    @NotBlank(message = "Endpoint không được để trống")
    private String endpoint;
}
