package com.rentspace.domain.interaction;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertFalse;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class InteractionRepositoryTest {

    @Autowired
    private InteractionRepository interactionRepository;

    // ===== existsRecentView =====

    @Test
    void existsRecentView_shouldReturnFalse_whenNoViewsExist() {
        Instant since = Instant.now().minus(30, ChronoUnit.MINUTES);
        boolean result = interactionRepository.existsRecentView(999L, 999L, since);
        assertFalse(result);
    }

    // ===== findRecentByUser =====

    @Test
    void findRecentByUser_shouldReturnEmpty_whenUserHasNoInteractions() {
        Instant since = Instant.now().minus(90, ChronoUnit.DAYS);
        List<UserListingInteraction> result = interactionRepository.findRecentByUser(999L, since);
        assertThat(result).isEmpty();
    }

    // ===== findCoViewedListings (native SQL) =====

    @Test
    void findCoViewedListings_shouldReturnEmpty_whenListingHasNoCoViews() {
        Instant since = Instant.now().minus(90, ChronoUnit.DAYS);
        List<Object[]> result = interactionRepository.findCoViewedListings(999L, since, 10);
        assertThat(result).isEmpty();
    }

    @Test
    void findCoViewedListings_shouldRespectLimit_whenNoDataExists() {
        Instant since = Instant.now().minus(90, ChronoUnit.DAYS);
        // Kiểm tra LIMIT clause không gây lỗi SQL với giá trị nhỏ
        List<Object[]> result = interactionRepository.findCoViewedListings(999L, since, 5);
        assertThat(result).isNotNull();
        assertThat(result.size()).isLessThanOrEqualTo(5);
    }
}
