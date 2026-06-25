package com.rentspace.domain.contract;

import com.rentspace.common.response.ApiResponse;
import com.rentspace.domain.contract.dto.ContractResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/contracts")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'TENANT', 'LANDLORD', 'ADMIN')")
public class ContractController {

    private final ContractService contractService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ContractResponse>> get(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(
                contractService.getContract(id, userDetails.getUsername())));
    }

    @PostMapping("/{id}/sign")
    public ResponseEntity<ApiResponse<ContractResponse>> sign(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(
                contractService.signContract(id, userDetails.getUsername())));
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadPdf(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        byte[] pdf = contractService.downloadPdf(id, userDetails.getUsername());
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/pdf"))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"contract-" + id + ".pdf\"")
                .body(pdf);
    }

    @GetMapping("/mine")
    public ResponseEntity<ApiResponse<Page<ContractResponse>>> mine(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) ContractStatus status,
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(
                contractService.getMyContracts(userDetails.getUsername(), status, pageable)));
    }
}
