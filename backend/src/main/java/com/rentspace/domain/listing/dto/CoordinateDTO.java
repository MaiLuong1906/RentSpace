package com.rentspace.domain.listing.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CoordinateDTO {
    @NotNull(message = "Vĩ độ (latitude) không được để trống")
    private BigDecimal lat;

    @NotNull(message = "Kinh độ (longitude) không được để trống")
    private BigDecimal lng;
}
