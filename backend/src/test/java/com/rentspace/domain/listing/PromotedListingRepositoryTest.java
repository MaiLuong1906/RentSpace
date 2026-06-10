package com.rentspace.domain.listing;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class PromotedListingRepositoryTest {

    @Autowired
    private PromotedListingRepository promotedListingRepository;

    @Test
    void should_executeFindAllActive_withoutSyntaxErrors() {
        var results = promotedListingRepository.findAllActive(LocalDateTime.now());
        assertThat(results).isNotNull();
    }
}
