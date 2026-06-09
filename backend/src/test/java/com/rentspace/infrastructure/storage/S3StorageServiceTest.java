package com.rentspace.infrastructure.storage;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.net.URL;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class S3StorageServiceTest {

    @Mock
    private S3Client s3Client;

    @Mock
    private S3Presigner s3Presigner;

    @InjectMocks
    private S3StorageService s3StorageService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(s3StorageService, "bucketName", "test-bucket");
        ReflectionTestUtils.setField(s3StorageService, "region", "ap-southeast-1");
    }

    @Test
    void getPresignedUrl_WhenValidAmazonUrl_ShouldPresignAndReturnSignedUrl() throws Exception {
        // Given
        String rawUrl = "https://test-bucket.s3.ap-southeast-1.amazonaws.com/kyc/cccd-123.jpg";
        PresignedGetObjectRequest presignedRequest = mock(PresignedGetObjectRequest.class);
        URL signedUrl = new URL("https://test-bucket.s3.ap-southeast-1.amazonaws.com/kyc/cccd-123.jpg?X-Amz-Signature=mock-sig");

        when(presignedRequest.url()).thenReturn(signedUrl);
        when(s3Presigner.presignGetObject(any(GetObjectPresignRequest.class))).thenReturn(presignedRequest);

        // When
        String result = s3StorageService.getPresignedUrl(rawUrl);

        // Then
        assertNotNull(result);
        assertEquals("https://test-bucket.s3.ap-southeast-1.amazonaws.com/kyc/cccd-123.jpg?X-Amz-Signature=mock-sig", result);
        verify(s3Presigner, times(1)).presignGetObject(any(GetObjectPresignRequest.class));
    }
}
