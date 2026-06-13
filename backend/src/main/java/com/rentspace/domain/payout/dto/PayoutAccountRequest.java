package com.rentspace.domain.payout.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayoutAccountRequest {

    @NotBlank(message = "Tên ngân hàng không được để trống")
    @Size(max = 100, message = "Tên ngân hàng không được quá 100 ký tự")
    private String bankName;

    @NotBlank(message = "Mã ngân hàng không được để trống")
    @Size(max = 20, message = "Mã ngân hàng không được quá 20 ký tự")
    private String bankCode;

    @NotBlank(message = "Số tài khoản không được để trống")
    @Size(max = 50, message = "Số tài khoản không được quá 50 ký tự")
    private String accountNumber;

    @NotBlank(message = "Tên chủ tài khoản không được để trống")
    @Size(max = 200, message = "Tên chủ tài khoản không được quá 200 ký tự")
    private String accountName;
}
