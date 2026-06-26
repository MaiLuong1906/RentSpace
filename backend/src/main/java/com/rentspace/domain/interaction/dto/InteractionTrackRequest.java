package com.rentspace.domain.interaction.dto;

import com.rentspace.domain.interaction.InteractionType;
import jakarta.validation.constraints.NotNull;

public record InteractionTrackRequest(

    @NotNull(message = "listingId không được để trống")
    Long listingId,

    @NotNull(message = "Loại tương tác không được để trống")
    InteractionType type,

    Integer viewDurationSec,

    String referrer,

    String sessionId
) {}
