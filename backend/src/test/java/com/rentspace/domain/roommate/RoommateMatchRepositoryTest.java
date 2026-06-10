package com.rentspace.domain.roommate;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class RoommateMatchRepositoryTest {

    @Autowired
    private RoommateMatchRepository roommateMatchRepository;

    @Test
    void should_executeFindSuggestions_withoutSyntaxErrors() {
        var results = roommateMatchRepository.findSuggestions(1L);
        assertThat(results).isNotNull();
    }
}
