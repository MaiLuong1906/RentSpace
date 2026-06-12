package com.rentspace.domain.roommate.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoommateProfileRequest {

    @NotBlank(message = "Giới tính không được để trống")
    @Size(max = 20, message = "Giới tính không được vượt quá 20 ký tự")
    private String gender;

    @NotBlank(message = "Nghề nghiệp không được để trống")
    @Size(max = 100, message = "Nghề nghiệp không được vượt quá 100 ký tự")
    private String occupation;

    @NotNull(message = "Ngân sách tối thiểu không được để trống")
    @Min(value = 0, message = "Ngân sách tối thiểu phải lớn hơn hoặc bằng 0")
    private Long budgetMin;

    @NotNull(message = "Ngân sách tối đa không được để trống")
    @Min(value = 0, message = "Ngân sách tối đa phải lớn hơn hoặc bằng 0")
    private Long budgetMax;

    @NotBlank(message = "Khu vực mong muốn không được để trống")
    @Size(max = 255, message = "Khu vực mong muốn không được vượt quá 255 ký tự")
    private String preferredArea;

    @NotNull(message = "Ngày chuyển vào không được để trống")
    private LocalDate moveInDate;

    @NotEmpty(message = "Danh sách thẻ lối sống không được để trống")
    private List<String> lifestyleTags;

    @Size(max = 1000, message = "Giới thiệu bản thân không được vượt quá 1000 ký tự")
    private String bio;

    private Boolean isActive;
}
