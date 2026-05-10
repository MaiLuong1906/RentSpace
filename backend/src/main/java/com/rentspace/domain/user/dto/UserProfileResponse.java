package com.rentspace.domain.user.dto;

import com.rentspace.domain.user.User;
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
    private User.Role role;
    private User.KycStatus kycStatus;
    private Boolean isEmailVerified;
    private LocalDateTime createdAt;
}
