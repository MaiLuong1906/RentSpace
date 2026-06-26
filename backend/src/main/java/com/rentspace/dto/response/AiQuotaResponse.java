package com.rentspace.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiQuotaResponse {

    private Integer used;
    private Integer limit;
    private Instant resetsAt;
}
