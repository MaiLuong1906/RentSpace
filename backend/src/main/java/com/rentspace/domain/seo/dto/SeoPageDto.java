package com.rentspace.domain.seo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeoPageDto {

    private Long id;
    private String path;
    private String title;
    private String metaDesc;
    private String h1;
    private OffsetDateTime lastModified;
    private BigDecimal priority;
    private String changeFreq;
}
