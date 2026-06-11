package com.rentspace.domain.post;

import com.rentspace.domain.post.enums.PostType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    
    // JOIN FETCH để tránh N+1 khi load feed
    @Query("SELECT p FROM Post p JOIN FETCH p.author u LEFT JOIN FETCH p.relatedListing WHERE p.isHidden = false")
    Page<Post> findAllActive(Pageable pageable);
    
    @Query("SELECT p FROM Post p JOIN FETCH p.author u LEFT JOIN FETCH p.relatedListing WHERE p.type = :type AND p.isHidden = false")
    Page<Post> findByType(PostType type, Pageable pageable);
    
    List<Post> findByAuthorId(Long authorId);

    long countByAuthorIdAndCreatedAtAfter(Long authorId, LocalDateTime startOfDay);
}
