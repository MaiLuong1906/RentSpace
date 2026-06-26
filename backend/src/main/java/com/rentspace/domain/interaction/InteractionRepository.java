package com.rentspace.domain.interaction;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface InteractionRepository extends JpaRepository<UserListingInteraction, Long> {

    // Lấy interactions gần đây của user (cho user-based recommendation)
    @Query("""
            SELECT i FROM UserListingInteraction i
            WHERE i.userId = :userId
              AND i.interactionType IN ('VIEW','SAVE','CHAT_INIT','DEPOSIT')
              AND i.createdAt > :since
            ORDER BY i.createdAt DESC
            """)
    List<UserListingInteraction> findRecentByUser(@Param("userId") Long userId,
                                                  @Param("since") Instant since);

    // Item-based collaborative filtering: listing nào thường được xem cùng listing này
    @Query(value = """
            SELECT uli2.listing_id, COUNT(DISTINCT uli2.user_id) AS score
            FROM user_listing_interactions uli1
            JOIN user_listing_interactions uli2
                 ON uli2.user_id = uli1.user_id
                AND uli2.listing_id != uli1.listing_id
                AND uli2.interaction_type IN ('VIEW','SAVE','CHAT_INIT','DEPOSIT')
            WHERE uli1.listing_id = :listingId
              AND uli1.interaction_type IN ('VIEW','SAVE','CHAT_INIT','DEPOSIT')
              AND uli1.created_at > :since
            GROUP BY uli2.listing_id
            ORDER BY score DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> findCoViewedListings(@Param("listingId") Long listingId,
                                        @Param("since") Instant since,
                                        @Param("limit") int limit);

    // Kiểm tra dedup: user đã VIEW listing này trong khoảng thời gian gần đây chưa
    @Query("""
            SELECT COUNT(i) > 0 FROM UserListingInteraction i
            WHERE i.userId = :userId
              AND i.listingId = :listingId
              AND i.interactionType = com.rentspace.domain.interaction.InteractionType.VIEW
              AND i.createdAt > :since
            """)
    boolean existsRecentView(@Param("userId") Long userId,
                             @Param("listingId") Long listingId,
                             @Param("since") Instant since);

    // Tầng 3: Personalized — listings chưa xem, weighted score theo loại interaction
    // excludedIds phải chứa ít nhất 1 phần tử (dùng [-1L] nếu rỗng để tránh lỗi SQL)
    @Query(value = """
            SELECT candidate.listing_id, SUM(candidate.score) AS total_score
            FROM (
                SELECT uli2.listing_id,
                       COUNT(DISTINCT uli2.user_id) *
                       CASE uli1.interaction_type
                           WHEN 'DEPOSIT'   THEN 5
                           WHEN 'SAVE'      THEN 3
                           WHEN 'CHAT_INIT' THEN 2
                           WHEN 'VIEW'      THEN 1
                           ELSE 1
                       END AS score
                FROM user_listing_interactions uli1
                JOIN user_listing_interactions uli2
                     ON uli2.user_id = uli1.user_id
                    AND uli2.listing_id NOT IN (:excludedIds)
                WHERE uli1.user_id = :userId
                  AND uli1.created_at > :since
                GROUP BY uli2.listing_id, uli1.interaction_type
            ) candidate
            JOIN listings l ON l.id = candidate.listing_id AND l.status = 'ACTIVE'
            GROUP BY candidate.listing_id
            ORDER BY total_score DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> findForUser(@Param("userId") Long userId,
                               @Param("excludedIds") List<Long> excludedIds,
                               @Param("since") Instant since,
                               @Param("limit") int limit);

    // Trending: top listings theo tổng interactions trong khoảng thời gian
    @Query(value = """
            SELECT uli.listing_id, COUNT(*) AS interaction_count
            FROM user_listing_interactions uli
            JOIN listings l ON l.id = uli.listing_id AND l.status = 'ACTIVE'
            WHERE uli.created_at > :since
              AND uli.interaction_type IN ('VIEW','SAVE','CHAT_INIT','DEPOSIT')
            GROUP BY uli.listing_id
            ORDER BY interaction_count DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> findTrending(@Param("since") Instant since,
                                @Param("limit") int limit);
}
