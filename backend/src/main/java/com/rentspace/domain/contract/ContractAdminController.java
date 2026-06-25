package com.rentspace.domain.contract;

import com.rentspace.common.response.ApiResponse;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/contracts")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ContractAdminController {

    private final ContractService contractService;

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<Void>> cancel(
            @PathVariable Long id,
            @RequestParam @NotBlank String reason) {
        contractService.cancelContract(id, reason);
        return ResponseEntity.ok(ApiResponse.success("Hợp đồng đã được hủy.", null));
    }
}
