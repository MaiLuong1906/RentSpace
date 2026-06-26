package com.rentspace.domain.contract;

import com.rentspace.common.response.ApiResponse;
import com.rentspace.dto.request.ContractAiRequest;
import com.rentspace.dto.response.AiQuotaResponse;
import com.rentspace.dto.response.ContractAiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/contracts")
@RequiredArgsConstructor
@Tag(name = "Contract AI API", description = "AI assistant giải thích điều khoản hợp đồng thuê nhà")
public class ContractAiController {

    private final ContractAiService contractAiService;

    @PostMapping("/{id}/ai/ask")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Hỏi AI về nội dung hợp đồng (landlord hoặc tenant của hợp đồng)")
    public ResponseEntity<ApiResponse<ContractAiResponse>> askAi(
            @PathVariable Long id,
            @Valid @RequestBody ContractAiRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        ContractAiResponse response = contractAiService.ask(id, userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}/ai/quota")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Xem số câu hỏi AI còn lại hôm nay")
    public ResponseEntity<ApiResponse<AiQuotaResponse>> getQuota(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        AiQuotaResponse quota = contractAiService.getQuota(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(quota));
    }
}
