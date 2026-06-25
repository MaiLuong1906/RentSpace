package com.rentspace.domain.verification;

import com.rentspace.domain.verification.dto.AdminVerificationItem;
import com.rentspace.domain.verification.dto.VerificationInitResponse;
import com.rentspace.domain.verification.dto.VerificationResult;
import com.rentspace.domain.verification.dto.VerificationStatusDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface VerificationService {

    VerificationInitResponse submitIdCard(String userEmail, MultipartFile front, MultipartFile back);

    VerificationResult submitSelfie(String userEmail, MultipartFile selfie, String faceToken);

    void manualApprove(Long verificationId, String adminNote);

    void manualReject(Long verificationId, String reason);

    VerificationStatusDto getStatus(String userEmail);

    List<AdminVerificationItem> getPendingList();
}
