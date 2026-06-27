package com.rentspace.domain.ai;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(
    name = "ai_usage_log",
    indexes = {
        @Index(name = "idx_ai_log_user_contract", columnList = "user_id, contract_id, created_at DESC"),
        @Index(name = "idx_ai_log_feature",       columnList = "feature, created_at DESC")
    }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AiUsageLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "contract_id")
    private Long contractId;

    @Column(name = "feature", nullable = false, length = 50)
    private String feature;

    @Column(name = "model_used", nullable = false, length = 100)
    private String modelUsed;

    @Column(name = "input_tokens", nullable = false)
    private Integer inputTokens;

    @Column(name = "output_tokens", nullable = false)
    private Integer outputTokens;

    @Column(name = "latency_ms")
    private Integer latencyMs;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
