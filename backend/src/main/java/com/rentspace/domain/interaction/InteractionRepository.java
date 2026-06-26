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
}
