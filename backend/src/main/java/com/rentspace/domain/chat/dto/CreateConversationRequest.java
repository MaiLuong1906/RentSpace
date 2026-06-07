package com.rentspace.domain.chat.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

/**
 * Request DTO để khởi tạo cuộc hội thoại mới giữa Tenant và Landlord.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateConversationRequest {

    @NotNull(message = "landlordId không được để trống")
    private Long landlordId;
}
