package com.rentspace.domain.roommate.dto;

import com.rentspace.domain.roommate.enums.ProfileType;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoommateProfileRequest {

    @NotNull(message = "Loại hồ sơ không được để trống")
    private ProfileType profileType;

    // ── Trường dành riêng cho HAS_ROOM ──────────────────────────

    /** ID listing đang đăng (tuỳ chọn, chỉ hợp lệ khi profileType = HAS_ROOM) */
    private Long listingId;

    /** Số người tối đa trong phòng (bắt buộc khi HAS_ROOM, >= 2) */
    @Min(value = 2, message = "Số người tối đa phải ít nhất là 2")
    private Integer maxOccupants;

    /** Số người hiện đang ở (bắt buộc khi HAS_ROOM, >= 0) */
    @Min(value = 0, message = "Số người hiện tại không được âm")
    private Integer currentOccupants;

    // ── Trường chung ─────────────────────────────────────────────

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

    /** SEEKING_ROOM: khu vực mong muốn. HAS_ROOM: khu vực của phòng */
    @NotBlank(message = "Khu vực không được để trống")
    @Size(max = 255, message = "Khu vực không được vượt quá 255 ký tự")
    private String preferredArea;

    /** SEEKING_ROOM: ngày muốn chuyển vào. HAS_ROOM: ngày phòng có sẵn */
    @NotNull(message = "Ngày không được để trống")
    private LocalDate moveInDate;

    @NotEmpty(message = "Danh sách thẻ lối sống không được để trống")
    private List<String> lifestyleTags;

    @Size(max = 1000, message = "Giới thiệu bản thân không được vượt quá 1000 ký tự")
    private String bio;

    private Boolean isActive;
}
