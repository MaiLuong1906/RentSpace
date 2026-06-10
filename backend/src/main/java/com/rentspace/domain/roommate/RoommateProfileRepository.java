package com.rentspace.domain.roommate;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoommateProfileRepository extends JpaRepository<RoommateProfile, Long> {
    
    Optional<RoommateProfile> findByUserId(Long userId);
}
