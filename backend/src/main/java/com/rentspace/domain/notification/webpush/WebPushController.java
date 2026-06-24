package com.rentspace.domain.notification.webpush;

import com.rentspace.common.response.ApiResponse;
import com.rentspace.domain.notification.webpush.dto.WebPushSubscribeRequest;
import com.rentspace.domain.notification.webpush.dto.WebPushUnsubscribeRequest;
import com.rentspace.domain.user.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications/web-push")
@RequiredArgsConstructor
@Tag(name = "Web Push API", description = "Quản lý đăng ký Web Push Notification")
public class WebPushController {

    private final WebPushService webPushService;

    @PostMapping("/subscribe")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Đăng ký nhận Web Push Notification")
    public ResponseEntity<ApiResponse<Void>> subscribe(
            @Valid @RequestBody WebPushSubscribeRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        webPushService.subscribe(userDetails.getUser().getId(), request);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/unsubscribe")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Hủy đăng ký Web Push Notification")
    public ResponseEntity<ApiResponse<Void>> unsubscribe(
            @Valid @RequestBody WebPushUnsubscribeRequest request) {
        webPushService.unsubscribe(request.getEndpoint());
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
