package com.rentspace.domain.notification.webpush.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WebPushSubscribeRequest {

    @NotBlank(message = "Endpoint không được để trống")
    private String endpoint;

    @NotNull(message = "Keys không được để trống")
    @Valid
    private PushKeys keys;

    private String userAgent;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PushKeys {
        @NotBlank(message = "p256dh không được để trống")
        private String p256dh;

        @NotBlank(message = "auth không được để trống")
        private String auth;
    }
}
