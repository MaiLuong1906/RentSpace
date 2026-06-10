package com.rentspace.domain.deposit.dto;

import com.rentspace.domain.deposit.enums.DisputeReason;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class DisputeRequest {
    @NotNull(message = "Lý do khiếu nại là bắt buộc")
    private DisputeReason reason;

    @NotBlank(message = "Mô tả chi tiết là bắt buộc")
    private String description;

    private List<String> evidenceUrls;
}
