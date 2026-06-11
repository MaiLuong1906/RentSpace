package com.rentspace.domain.post.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostAuthorDto {
    private Long id;
    private String name;
    private String avatarUrl;
    private String kycStatus;
}
