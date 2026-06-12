package com.rentspace.domain.roommate.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoommateMatchResponse {
    private Long id;
    private RoommateProfileResponse profileA;
    private RoommateProfileResponse profileB;
    private BigDecimal matchScore;
    private String status;
    private LocalDateTime createdAt;
}
