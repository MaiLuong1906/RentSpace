package com.rentspace.domain.auth.dto;

import com.rentspace.domain.user.User;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private UserSummary user;

    @Data
    @Builder
    public static class UserSummary {
        private Long id;
        private String email;
        private String fullName;
        private String role;

        public static UserSummary from(User user) {
            return UserSummary.builder()
                    .id(user.getId())
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .role(user.getRole().name())
                    .build();
        }
    }
}
