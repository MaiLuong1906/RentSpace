package com.rentspace.domain.roommate;

import com.rentspace.domain.roommate.enums.MatchStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoommateMatchRepository extends JpaRepository<RoommateMatch, Long> {
    
    @Query("SELECT m FROM RoommateMatch m WHERE (m.profileA.id = :profileId OR m.profileB.id = :profileId) AND m.status != 'DISMISSED' ORDER BY m.matchScore DESC")
    List<RoommateMatch> findSuggestions(Long profileId);
    
    List<RoommateMatch> findByProfileAIdOrProfileBIdAndStatus(Long profileAId, Long profileBId, MatchStatus status);
}
