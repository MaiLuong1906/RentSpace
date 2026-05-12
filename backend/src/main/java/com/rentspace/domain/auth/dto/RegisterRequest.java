package com.rentspace.domain.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 8, message = "Mật khẩu phải có ít nhất 8 ký tự")
    @Pattern(regexp = "^(?=.*[A-Z])(?=.*\\d).*$", message = "Mật khẩu phải chứa ít nhất 1 chữ hoa và 1 chữ số")
    private String password;

    @NotBlank(message = "Họ tên không được để trống")
    private String fullName;

    private String phoneNumber;

    @NotBlank(message = "Vai trò không được để trống")
    @Pattern(regexp = "^(TENANT|LANDLORD)$", message = "Vai trò chỉ có thể là TENANT hoặc LANDLORD")
    private String role; // "TENANT" or "LANDLORD"
}
