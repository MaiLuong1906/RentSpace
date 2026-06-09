package com.rentspace.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3ClientBuilder;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;

@Configuration
public class S3Config {

    @Value("${aws.credentials.access-key}")
    private String accessKey;

    @Value("${aws.credentials.secret-key}")
    private String secretKey;

    @Value("${aws.s3.region}")
    private String region;

    @Value("${aws.s3.endpoint-url:}")
    private String endpointUrl;

    @Bean
    public S3Client s3Client() {
        AwsBasicCredentials credentials;
        if ("none".equals(accessKey) || "none".equals(secretKey)) {
            credentials = AwsBasicCredentials.create("dummy", "dummy");
        } else {
            credentials = AwsBasicCredentials.create(accessKey, secretKey);
        }

        S3ClientBuilder builder = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(credentials));

        if (endpointUrl != null && !endpointUrl.isBlank()) {
            builder.endpointOverride(URI.create(endpointUrl));
            builder.forcePathStyle(true); // MinIO/LocalStack require path style access
        }

        return builder.build();
    }

    @Bean
    public S3Presigner s3Presigner() {
        AwsBasicCredentials credentials;
        if ("none".equals(accessKey) || "none".equals(secretKey)) {
            credentials = AwsBasicCredentials.create("dummy", "dummy");
        } else {
            credentials = AwsBasicCredentials.create(accessKey, secretKey);
        }

        S3Presigner.Builder builder = S3Presigner.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(credentials));

        if (endpointUrl != null && !endpointUrl.isBlank()) {
            builder.endpointOverride(URI.create(endpointUrl));
        }

        return builder.build();
    }
}
