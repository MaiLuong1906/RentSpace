package com.rentspace.domain.post;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PostReportRepository extends JpaRepository<PostReport, Long> {
    
    boolean existsByPostIdAndReporterId(Long postId, Long reporterId);
    
    long countByPostId(Long postId);
}
