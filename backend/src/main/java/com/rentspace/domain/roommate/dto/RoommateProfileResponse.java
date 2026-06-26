package com.rentspace.domain.roommate.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoommateProfileResponse {
    private Long id;
    private Long userId;
    private String fullName;
    private String avatar;
    private String kycStatus;

    private String profileType;
    private Long listingId;
    private Integer maxOccupants;
    private Integer currentOccupants;

    private String gender;
    private String occupation;
    private Long budgetMin;
    private Long budgetMax;
    private String preferredArea;
    private LocalDate moveInDate;
    private List<String> lifestyleTags;
    private String bio;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
