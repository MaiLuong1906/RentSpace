package com.rentspace.domain.notification.webpush.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload gửi đến browser qua Web Push — tối đa ~4KB.
 * Chỉ chứa dữ liệu tối thiểu để hiển thị notification.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebPushPayload {

    private String title;
    private String content;
    private String url;
}
