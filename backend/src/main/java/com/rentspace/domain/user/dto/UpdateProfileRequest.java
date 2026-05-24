package com.rentspace.domain.user.dto;

import com.rentspace.common.validator.ValidPhoneNumber;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @Size(min = 2, max = 100, message = "Họ tên phải từ 2 đến 100 ký tự")
    private String fullName;

    @ValidPhoneNumber
    private String phoneNumber;
}
