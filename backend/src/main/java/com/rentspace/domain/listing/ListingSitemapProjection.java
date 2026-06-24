package com.rentspace.domain.listing;

import java.time.LocalDateTime;

public interface ListingSitemapProjection {
    Long getId();
    LocalDateTime getUpdatedAt();
}
