package com.rentspace.domain.roommate;

import com.rentspace.domain.roommate.enums.MatchStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

@Repository
public interface RoommateMatchRepository extends JpaRepository<RoommateMatch, Long> {
    
    @Query("SELECT m FROM RoommateMatch m " +
           "JOIN FETCH m.profileA pa JOIN FETCH pa.user ua " +
           "JOIN FETCH m.profileB pb JOIN FETCH pb.user ub " +
           "WHERE (pa.id = :profileId OR pb.id = :profileId) " +
           "AND m.status != com.rentspace.domain.roommate.enums.MatchStatus.DISMISSED " +
           "ORDER BY m.matchScore DESC")
    List<RoommateMatch> findSuggestions(Long profileId);
    
    List<RoommateMatch> findByProfileAIdOrProfileBIdAndStatus(Long profileAId, Long profileBId, MatchStatus status);

    @Query("SELECT m FROM RoommateMatch m " +
           "WHERE (m.profileA.id = :profileAId AND m.profileB.id = :profileBId) " +
           "OR (m.profileA.id = :profileBId AND m.profileB.id = :profileAId)")
    Optional<RoommateMatch> findMatchBetween(Long profileAId, Long profileBId);

    @Query("SELECT m FROM RoommateMatch m WHERE m.profileA.id = :profileId OR m.profileB.id = :profileId")
    List<RoommateMatch> findAllMatchesForProfile(@Param("profileId") Long profileId);
}


