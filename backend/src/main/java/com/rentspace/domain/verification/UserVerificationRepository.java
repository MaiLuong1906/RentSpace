package com.rentspace.domain.verification;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserVerificationRepository extends JpaRepository<UserVerification, Long> {

    Optional<UserVerification> findByUserId(Long userId);

    List<UserVerification> findAllByStatus(VerificationStatus status);
}
