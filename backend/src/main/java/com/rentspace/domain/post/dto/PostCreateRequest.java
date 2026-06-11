package com.rentspace.domain.post.dto;

import com.rentspace.domain.post.enums.PostType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostCreateRequest {

    @NotNull(message = "Loại bài đăng không được để trống")
    private PostType type;

    @NotBlank(message = "Nội dung bài đăng không được để trống")
    @Size(max = 5000, message = "Nội dung bài đăng không được vượt quá 5000 ký tự")
    private String content;

    @Size(max = 5, message = "Không được upload quá 5 ảnh")
    private List<String> imageUrls;

    private Long relatedListingId;

    @Size(max = 100, message = "Tên quận/huyện không được vượt quá 100 ký tự")
    private String district;
}
