package com.rentspace.domain.roommate;

import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.Set;

@Component
public class RoommateMatchingEngine {

    /**
     * Tính toán điểm tương hợp giữa 2 hồ sơ RoommateProfile (Thang điểm 100)
     */
    public BigDecimal calculateMatchScore(RoommateProfile a, RoommateProfile b) {
        if (a == null || b == null) {
            return BigDecimal.ZERO;
        }

        // Kiểm tra tính tương hợp về địa lý/khu vực mong muốn
        if (!isLocationCompatible(a.getPreferredArea(), b.getPreferredArea())) {
            return new BigDecimal("0.00");
        }

        int budgetScore = calculateBudgetScore(a, b);
        double lifestyleScore = calculateLifestyleScore(a, b);
        int moveInScore = calculateMoveInScore(a, b);
        int genderScore = calculateGenderScore(a, b);

        double totalScore = budgetScore + lifestyleScore + moveInScore + genderScore;

        // Nếu cùng thành phố nhưng khác quận/huyện, giảm 20% điểm tương hợp
        if (!isSameDistrict(a.getPreferredArea(), b.getPreferredArea())) {
            totalScore = totalScore * 0.8;
        }
        
        // Trả về BigDecimal làm tròn 2 chữ số thập phân
        return BigDecimal.valueOf(totalScore).setScale(2, RoundingMode.HALF_UP);
    }

    public boolean isSameDistrict(String areaA, String areaB) {
        if (areaA == null || areaB == null || areaA.trim().isEmpty() || areaB.trim().isEmpty()) {
            return true; // Nếu rỗng hoặc null, không phạt để tương thích ngược
        }
        String[] partsA = areaA.split(",");
        String[] partsB = areaB.split(",");
        if (partsA.length > 0 && partsB.length > 0) {
            String distA = normalizeLocation(partsA[0]);
            String distB = normalizeLocation(partsB[0]);
            distA = cleanDistrictName(distA);
            distB = cleanDistrictName(distB);
            return distA.equals(distB);
        }
        return false;
    }

    private String cleanDistrictName(String district) {
        return district.replace("quan", "")
                       .replace("huyen", "")
                       .replaceAll("\\s+", "")
                       .trim();
    }

    private int calculateBudgetScore(RoommateProfile a, RoommateProfile b) {
        if (a.getBudgetMin() == null || a.getBudgetMax() == null ||
            b.getBudgetMin() == null || b.getBudgetMax() == null) {
            return 0;
        }

        long maxMin = Math.max(a.getBudgetMin(), b.getBudgetMin());
        long minMax = Math.min(a.getBudgetMax(), b.getBudgetMax());

        // Có khoảng ngân sách giao nhau (Overlap)
        if (maxMin <= minMax) {
            return 40;
        }

        // Không giao nhau, tính khoảng cách giữa 2 khoảng ngân sách
        long gap = maxMin - minMax;
        if (gap <= 1000000L) { // Chênh lệch dưới hoặc bằng 1,000,000 VND
            return 20;
        }

        return 0;
    }

    private double calculateLifestyleScore(RoommateProfile a, RoommateProfile b) {
        if (a.getLifestyleTags() == null || b.getLifestyleTags() == null) {
            return 0.0;
        }

        Set<String> setA = new HashSet<>(a.getLifestyleTags());
        Set<String> setB = new HashSet<>(b.getLifestyleTags());

        if (setA.isEmpty() && setB.isEmpty()) {
            return 30.0;
        }

        Set<String> intersection = new HashSet<>(setA);
        intersection.retainAll(setB);

        Set<String> union = new HashSet<>(setA);
        union.addAll(setB);

        if (union.isEmpty()) {
            return 0.0;
        }

        // Jaccard similarity * 30
        return ((double) intersection.size() / union.size()) * 30.0;
    }

    private int calculateMoveInScore(RoommateProfile a, RoommateProfile b) {
        if (a.getMoveInDate() == null || b.getMoveInDate() == null) {
            return 0;
        }

        long daysBetween = Math.abs(ChronoUnit.DAYS.between(a.getMoveInDate(), b.getMoveInDate()));

        if (daysBetween <= 15) {
            return 20;
        } else if (daysBetween <= 30) {
            return 10;
        }

        return 0;
    }

    private int calculateGenderScore(RoommateProfile a, RoommateProfile b) {
        if (a.getGender() == null || b.getGender() == null) {
            return 0;
        }

        // Cùng giới tính nhận 10 điểm, khác giới tính nhận 0 điểm
        if (a.getGender().trim().equalsIgnoreCase(b.getGender().trim())) {
            return 10;
        }

        return 0;
    }

    public boolean isLocationCompatible(String areaA, String areaB) {
        boolean isBlankA = areaA == null || areaA.trim().isEmpty();
        boolean isBlankB = areaB == null || areaB.trim().isEmpty();

        // Nếu cả 2 đều trống, xem như tương hợp để đảm bảo tính tương thích ngược (test cases cũ)
        if (isBlankA && isBlankB) {
            return true;
        }
        // Nếu một bên trống và bên kia có dữ liệu, xem như không tương hợp
        if (isBlankA || isBlankB) {
            return false;
        }

        String normA = normalizeLocation(areaA);
        String normB = normalizeLocation(areaB);

        // Tách chuỗi thành các từ
        String[] wordsA = normA.split("\\s+");
        String[] wordsB = normB.split("\\s+");

        Set<String> setA = filterStopWords(wordsA);
        Set<String> setB = filterStopWords(wordsB);

        // Nếu sau khi lọc stop words mà rỗng, kiểm tra so sánh chứa trực tiếp
        if (setA.isEmpty() || setB.isEmpty()) {
            return normA.contains(normB) || normB.contains(normA);
        }

        // Tìm giao của 2 tập hợp từ khoá đặc trưng
        Set<String> intersection = new HashSet<>(setA);
        intersection.retainAll(setB);

        return !intersection.isEmpty();
    }

    private String normalizeLocation(String input) {
        if (input == null) return "";
        // Loại bỏ dấu tiếng Việt (Normalizer NFD)
        String normalized = java.text.Normalizer.normalize(input, java.text.Normalizer.Form.NFD);
        normalized = normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        normalized = normalized.toLowerCase().replace('đ', 'd');

        // Chuẩn hoá các cụm viết tắt hoặc đồng nghĩa thông dụng
        normalized = normalized.replace("tp.hcm", "ho chi minh")
                               .replace("tp hcm", "ho chi minh")
                               .replace("tphcm", "ho chi minh")
                               .replace("sai gon", "ho chi minh")
                               .replace("saigon", "ho chi minh")
                               .replace("hcmc", "ho chi minh")
                               .replace("da nang", "danang")
                               .replace("ha noi", "hanoi")
                               .replace("hai phong", "haiphong")
                               .replace("can tho", "cantho");

        // Loại bỏ các ký tự đặc biệt, chỉ giữ lại chữ cái, số và khoảng trắng
        return normalized.replaceAll("[^a-z0-9\\s]", " ").trim();
    }

    private Set<String> filterStopWords(String[] words) {
        // Danh sách các từ dừng (stop words) không mang ý nghĩa địa danh cụ thể trong tiếng Việt
        Set<String> stopWords = Set.of(
            "quan", "huyen", "tp", "thanh", "pho", "tinh", "phuong", "xa", "duong", "viet", "nam", "near", "district", "city"
        );
        Set<String> resultSet = new HashSet<>();
        for (String w : words) {
            String trimmed = w.trim();
            if (!trimmed.isEmpty() && !stopWords.contains(trimmed)) {
                resultSet.add(trimmed);
            }
        }
        return resultSet;
    }
}
