package com.rentspace.domain.chat;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    @Query("SELECT c FROM Conversation c WHERE c.tenant.id = :userId OR c.landlord.id = :userId ORDER BY c.updatedAt DESC")
    List<Conversation> findAllByUserId(@Param("userId") Long userId);

    Optional<Conversation> findByTenantIdAndLandlordId(Long tenantId, Long landlordId);

    /**
     * Lấy danh sách cuộc hội thoại với lastMessage và unreadCount trong một query duy nhất.
     * Dùng native SQL với correlated subquery để tránh N+1 problem.
     *
     * @param userId ID người dùng hiện tại
     * @return danh sách Object[] gồm: conversationId, otherUserId, otherUserFullName, otherUserAvatarUrl,
     *         lastMessageContent, lastMessageTime, unreadCount
     */
    @Query(value = """
            SELECT
                c.id                AS conversationId,
                CASE WHEN c.tenant_id = :userId THEN u_other.id      ELSE u_self.id       END AS otherUserId,
                CASE WHEN c.tenant_id = :userId THEN u_other.full_name ELSE u_self.full_name END AS otherUserFullName,
                CASE WHEN c.tenant_id = :userId THEN u_other.avatar_url ELSE u_self.avatar_url END AS otherUserAvatarUrl,
                (SELECT m.content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1)  AS lastMessage,
                (SELECT m.created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS lastMessageTime,
                (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.sender_id != :userId AND m.is_read = false) AS unreadCount
            FROM conversations c
            JOIN users u_self  ON u_self.id  = CASE WHEN c.tenant_id = :userId THEN c.tenant_id   ELSE c.landlord_id END
            JOIN users u_other ON u_other.id = CASE WHEN c.tenant_id = :userId THEN c.landlord_id ELSE c.tenant_id  END
            WHERE c.tenant_id = :userId OR c.landlord_id = :userId
            ORDER BY c.updated_at DESC
            """, nativeQuery = true)
    List<Object[]> findConversationSummariesByUserId(@Param("userId") Long userId);
}

