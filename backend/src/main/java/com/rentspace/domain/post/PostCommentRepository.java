package com.rentspace.domain.post;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostCommentRepository extends JpaRepository<PostComment, Long> {
    
    List<PostComment> findByPostIdOrderByCreatedAtAsc(Long postId);
    
    long countByPostId(Long postId);
}
