package com.rentspace.domain.user.dto;

import com.rentspace.domain.user.enums.Role;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * DTO trả về thông tin công khai của user khi người khác xem hồ sơ.
 * Không bao gồm các trường nhạy cảm: email, số điện thoại, kyc, v.v.
 */
@Data
@Builder
public class PublicProfileResponse {
    private Long id;
    private String fullName;
    private String avatarUrl;
    private Role role;
    private LocalDateTime createdAt;
}
