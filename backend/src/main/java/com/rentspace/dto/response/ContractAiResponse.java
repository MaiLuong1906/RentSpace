package com.rentspace.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractAiResponse {

    private String answer;
    private Integer tokensUsed;
    private Integer questionsToday;
    private Integer dailyLimit;
}
