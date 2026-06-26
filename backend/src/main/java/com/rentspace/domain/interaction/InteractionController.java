package com.rentspace.domain.interaction;

import com.rentspace.domain.interaction.dto.InteractionTrackRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/interactions")
@RequiredArgsConstructor
@Tag(name = "Interactions", description = "Tracking hành vi người dùng cho Recommendation Engine")
public class InteractionController {

    private final InteractionTrackingService interactionTrackingService;

    @PostMapping("/track")
    @Operation(
        summary = "Ghi nhận sự kiện tương tác",
        description = "JWT optional — anonymous users được phép. Luôn trả 204, không chờ DB."
    )
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Void> track(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody InteractionTrackRequest request) {

        String email = (userDetails != null) ? userDetails.getUsername() : null;
        interactionTrackingService.track(email, request);
        return ResponseEntity.noContent().build();
    }
}
