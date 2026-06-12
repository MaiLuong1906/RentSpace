package com.rentspace.domain.roommate;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoommateProfileRepository extends JpaRepository<RoommateProfile, Long> {
    
    Optional<RoommateProfile> findByUserId(Long userId);

    @Query("SELECT p FROM RoommateProfile p JOIN FETCH p.user u WHERE p.isActive = true AND u.id != :currentUserId AND u.kycStatus = com.rentspace.domain.user.enums.KycStatus.VERIFIED")
    List<RoommateProfile> findActiveProfilesForMatching(Long currentUserId);

    @Query("SELECT p FROM RoommateProfile p JOIN FETCH p.user u WHERE p.isActive = true AND u.kycStatus = com.rentspace.domain.user.enums.KycStatus.VERIFIED")
    List<RoommateProfile> findAllActiveProfiles();
}

