package com.rentspace.domain.chat.dto;

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
    private Long landlordId;
}
