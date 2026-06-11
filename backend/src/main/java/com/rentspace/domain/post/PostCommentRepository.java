package com.rentspace.domain.post;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostCommentRepository extends JpaRepository<PostComment, Long> {
    
    List<PostComment> findByPostIdOrderByCreatedAtAsc(Long postId);
    
    Page<PostComment> findByPostIdAndIsHiddenFalseOrderByCreatedAtDesc(Long postId, Pageable pageable);
    
    long countByPostId(Long postId);
}
