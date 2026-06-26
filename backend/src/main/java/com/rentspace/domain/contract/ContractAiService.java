package com.rentspace.domain.contract;

import com.rentspace.dto.request.ContractAiRequest;
import com.rentspace.dto.response.AiQuotaResponse;
import com.rentspace.dto.response.ContractAiResponse;

public interface ContractAiService {

    ContractAiResponse ask(Long contractId, String userEmail, ContractAiRequest request);

    AiQuotaResponse getQuota(Long contractId, String userEmail);
}
