package com.rentspace.domain.deposit.dto;

import com.rentspace.domain.deposit.enums.DisputeStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ResolveDisputeRequest {
    @NotNull(message = "Kết quả giải quyết là bắt buộc")
    private DisputeStatus resolution;

    @NotBlank(message = "Ghi chú giải quyết là bắt buộc")
    private String resolutionNote;
}
