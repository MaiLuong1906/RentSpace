package com.rentspace.domain.user.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @Size(min = 2, max = 100, message = "Họ tên phải từ 2 đến 100 ký tự")
    private String fullName;

    @Pattern(regexp = "^(\\+84|0)[3-9]\\d{8}$", message = "Số điện thoại không hợp lệ")
    private String phoneNumber;
}
