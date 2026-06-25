package com.rentspace.infrastructure.ekyc.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
public class FptAiCardResponse {

    @JsonProperty("errorCode")
    private int errorCode;

    @JsonProperty("errorMessage")
    private String errorMessage;

    private List<CardData> data;

    public boolean isSuccess() {
        return errorCode == 0 && data != null && !data.isEmpty();
    }

    public CardData getCardData() {
        return (data != null && !data.isEmpty()) ? data.get(0) : null;
    }

    @Data
    @NoArgsConstructor
    public static class CardData {
        private String id;
        private String name;
        private String dob;
        private String home;
        private String address;

        @JsonProperty("id_prob")
        private Double idProb;

        @JsonProperty("name_prob")
        private Double nameProb;

        private Double confidence;

        @JsonProperty("face_token")
        private String faceToken;

        private String type;
    }
}
