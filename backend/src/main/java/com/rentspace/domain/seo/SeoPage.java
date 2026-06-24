package com.rentspace.domain.seo;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "seo_pages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeoPage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 500)
    private String path;

    @Column(length = 200)
    private String title;

    @Column(name = "meta_desc", length = 500)
    private String metaDesc;

    @Column(length = 200)
    private String h1;

    @UpdateTimestamp
    @Column(name = "last_modified")
    private OffsetDateTime lastModified;

    @Column(precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal priority = new BigDecimal("0.5");

    @Column(name = "change_freq", length = 20)
    @Builder.Default
    private String changeFreq = "weekly";
}
