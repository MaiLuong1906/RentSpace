package com.rentspace.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContractAiRequest {

    @NotBlank(message = "Câu hỏi không được để trống")
    @Size(max = 1000, message = "Câu hỏi không được vượt quá 1000 ký tự")
    private String question;
}
