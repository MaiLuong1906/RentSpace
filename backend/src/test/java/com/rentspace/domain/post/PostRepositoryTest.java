package com.rentspace.domain.post;

import com.rentspace.domain.post.enums.PostType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class PostRepositoryTest {

    @Autowired
    private PostRepository postRepository;

    @Test
    void should_executeFindAllActive_withoutSyntaxErrors() {
        var results = postRepository.findAllActive(PageRequest.of(0, 10));
        assertThat(results).isNotNull();
    }

    @Test
    void should_executeFindByType_withoutSyntaxErrors() {
        var results = postRepository.findByType(PostType.ROOMMATE, PageRequest.of(0, 10));
        assertThat(results).isNotNull();
    }
}
