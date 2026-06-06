package com.rentspace.infrastructure.redis;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RedisWSMessage implements Serializable {
    private String destination;
    private String payload;
}
