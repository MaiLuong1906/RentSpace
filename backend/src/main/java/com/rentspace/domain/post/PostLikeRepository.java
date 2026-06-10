package com.rentspace.domain.post;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PostLikeRepository extends JpaRepository<PostLike, PostLike.PostLikeId> {
    
    boolean existsByPostIdAndUserId(Long postId, Long userId);
    
    long countByPostId(Long postId);
}
