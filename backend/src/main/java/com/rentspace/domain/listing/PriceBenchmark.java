package com.rentspace.domain.listing;

import com.rentspace.domain.listing.enums.BenchmarkDataSource;
import com.rentspace.domain.listing.enums.RoomType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "price_benchmarks", uniqueConstraints = {
        @UniqueConstraint(name = "idx_price_bench_unique", columnNames = {"city", "district", "room_type", "area_bucket"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PriceBenchmark {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String city;

    @Column(nullable = false)
    private String district;

    @Enumerated(EnumType.STRING)
    @Column(name = "room_type", nullable = false)
    private RoomType roomType;

    @Column(name = "area_bucket", nullable = false)
    private String areaBucket;

    @Column(name = "p25_price", nullable = false)
    private Long p25Price;

    @Column(name = "p50_price", nullable = false)
    private Long p50Price;

    @Column(name = "p75_price", nullable = false)
    private Long p75Price;

    @Column(name = "sample_count", nullable = false)
    private Integer sampleCount;

    @Enumerated(EnumType.STRING)
    @Column(name = "data_source", nullable = false)
    @Builder.Default
    private BenchmarkDataSource dataSource = BenchmarkDataSource.LISTING;

    @CreationTimestamp
    @Column(name = "computed_at", nullable = false)
    private LocalDateTime computedAt;
}
