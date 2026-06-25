package com.rentspace.infrastructure.ekyc;

import com.rentspace.infrastructure.ekyc.dto.FptAiCardResponse;
import com.rentspace.infrastructure.ekyc.dto.FptAiFaceMatchResponse;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Component
@Slf4j
public class FptAiEkycClient {

    @Value("${app.ekyc.api-key:none}")
    private String apiKey;

    @Value("${app.ekyc.api-base-url:https://api.fpt.ai/vision/idencard/v2}")
    private String apiBaseUrl;

    private RestClient restClient;

    @PostConstruct
    public void init() {
        this.restClient = RestClient.builder()
                .baseUrl(apiBaseUrl)
                .build();
    }

    public FptAiCardResponse verifyFront(MultipartFile image) {
        log.info("FPT.AI verifyFront: file={}, size={}B", image.getOriginalFilename(), image.getSize());
        MultiValueMap<String, Object> body = buildImageBody("image", image);
        return restClient.post()
                .uri("/front")
                .header("api-key", apiKey)
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(body)
                .retrieve()
                .body(FptAiCardResponse.class);
    }

    public FptAiCardResponse verifyBack(MultipartFile image) {
        log.info("FPT.AI verifyBack: file={}, size={}B", image.getOriginalFilename(), image.getSize());
        MultiValueMap<String, Object> body = buildImageBody("image", image);
        return restClient.post()
                .uri("/back")
                .header("api-key", apiKey)
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(body)
                .retrieve()
                .body(FptAiCardResponse.class);
    }

    public FptAiFaceMatchResponse matchFace(MultipartFile selfie, String faceToken) {
        log.info("FPT.AI matchFace: selfie={}", selfie.getOriginalFilename());
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", toNamedResource(selfie));
        body.add("face_token", faceToken);
        return restClient.post()
                .uri("/compareface")
                .header("api-key", apiKey)
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(body)
                .retrieve()
                .body(FptAiFaceMatchResponse.class);
    }

    private MultiValueMap<String, Object> buildImageBody(String fieldName, MultipartFile image) {
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add(fieldName, toNamedResource(image));
        return body;
    }

    private ByteArrayResource toNamedResource(MultipartFile file) {
        try {
            final String filename = file.getOriginalFilename() != null
                    ? file.getOriginalFilename()
                    : "image.jpg";
            return new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return filename;
                }
            };
        } catch (IOException e) {
            throw new RuntimeException("Không thể đọc file ảnh: " + e.getMessage(), e);
        }
    }
}
