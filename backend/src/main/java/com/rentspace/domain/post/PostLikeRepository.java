package com.rentspace.domain.post;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostLikeRepository extends JpaRepository<PostLike, PostLike.PostLikeId> {
    
    boolean existsByPostIdAndUserId(Long postId, Long userId);
    
    long countByPostId(Long postId);

    @Query("SELECT pl.id.postId FROM PostLike pl WHERE pl.id.userId = :userId AND pl.id.postId IN :postIds")
    List<Long> findLikedPostIdsByUserIdAndPostIds(Long userId, List<Long> postIds);
}
