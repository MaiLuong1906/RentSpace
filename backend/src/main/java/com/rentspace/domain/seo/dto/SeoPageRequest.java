package com.rentspace.domain.seo.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeoPageRequest {

    @NotBlank(message = "Path không được để trống")
    @Size(max = 500, message = "Path tối đa 500 ký tự")
    private String path;

    @Size(max = 200, message = "Title tối đa 200 ký tự")
    private String title;

    @Size(max = 500, message = "Meta description tối đa 500 ký tự")
    private String metaDesc;

    @Size(max = 200, message = "H1 tối đa 200 ký tự")
    private String h1;

    @DecimalMin(value = "0.0", message = "Priority tối thiểu là 0.0")
    @DecimalMax(value = "1.0", message = "Priority tối đa là 1.0")
    private BigDecimal priority;

    @Pattern(
        regexp = "always|hourly|daily|weekly|monthly|yearly|never",
        message = "changeFreq không hợp lệ"
    )
    private String changeFreq;
}
