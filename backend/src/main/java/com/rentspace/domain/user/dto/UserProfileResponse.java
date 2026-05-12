package com.rentspace.domain.user.dto;

import com.rentspace.domain.user.enums.KycStatus;
import com.rentspace.domain.user.enums.Role;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UserProfileResponse {
    private Long id;
    private String email;
    private String fullName;
    private String phoneNumber;
    private String avatarUrl;
    private Role role;
    private KycStatus kycStatus;
    private Boolean isEmailVerified;
    private LocalDateTime createdAt;
}
