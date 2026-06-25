package com.rentspace.infrastructure.ekyc.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class FptAiFaceMatchResponse {

    private int code;
    private FaceMatchData data;

    public boolean isMatch() {
        return data != null && "true".equalsIgnoreCase(data.getIsMatch());
    }

    public double getSimilarityScore() {
        if (data == null || data.getSimilarity() == null) return 0.0;
        try {
            return Double.parseDouble(data.getSimilarity());
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }

    @Data
    @NoArgsConstructor
    public static class FaceMatchData {
        private String isMatch;
        private String similarity;
    }
}
