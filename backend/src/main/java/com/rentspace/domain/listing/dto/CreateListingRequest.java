package com.rentspace.domain.listing.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateListingRequest {

    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(min = 10, max = 200, message = "Tiêu đề phải từ 10 đến 200 ký tự")
    private String title;

    @Size(max = 5000, message = "Mô tả tối đa 5000 ký tự")
    private String description;

    @NotBlank(message = "Địa chỉ không được để trống")
    private String address;

    private String ward;
    private String district;
    private String city;

    @DecimalMin(value = "-90.0") @DecimalMax(value = "90.0")
    private BigDecimal latitude;

    @DecimalMin(value = "-180.0") @DecimalMax(value = "180.0")
    private BigDecimal longitude;

    @NotNull(message = "Giá thuê không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá thuê phải lớn hơn 0")
    private BigDecimal pricePerMonth;

    @DecimalMin(value = "0.0", inclusive = false, message = "Diện tích phải lớn hơn 0")
    private BigDecimal areaM2;

    @Min(0) private Integer numBedrooms;
    @Min(0) private Integer numBathrooms;

    private Boolean hasWifi = false;
    private Boolean hasParking = false;
    private Boolean hasAirConditioner = false;
    private Boolean hasWashingMachine = false;
    private Boolean allowPets = false;
}
