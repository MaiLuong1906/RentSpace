package com.rentspace.domain.roommate;

import com.rentspace.domain.roommate.enums.ProfileType;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.Set;

@Component
public class RoommateMatchingEngine {

    /**
     * Tính toán điểm tương hợp giữa 2 hồ sơ RoommateProfile (Thang điểm 100).
     *
     * Quy tắc loại trừ:
     * - HAS_ROOM vs HAS_ROOM → 0 (không thể ở ghép khi cả hai đã có phòng riêng)
     * - HAS_ROOM không còn chỗ trống → 0
     */
    public BigDecimal calculateMatchScore(RoommateProfile a, RoommateProfile b) {
        if (a == null || b == null) {
            return BigDecimal.ZERO;
        }

        boolean aIsHolder = a.getProfileType() == ProfileType.HAS_ROOM;
        boolean bIsHolder = b.getProfileType() == ProfileType.HAS_ROOM;

        // Hai người đều đã có phòng → không ghép được
        if (aIsHolder && bIsHolder) {
            return BigDecimal.ZERO;
        }

        // Phòng đã đầy chỗ → không ghép được
        if (aIsHolder && !hasAvailableSlot(a)) {
            return BigDecimal.ZERO;
        }
        if (bIsHolder && !hasAvailableSlot(b)) {
            return BigDecimal.ZERO;
        }

        // Kiểm tra tính tương hợp về địa lý/khu vực mong muốn
        if (!isLocationCompatible(a.getPreferredArea(), b.getPreferredArea())) {
            return new BigDecimal("0.00");
        }

        int budgetScore    = calculateBudgetScore(a, b);
        double lifestyleScore = calculateLifestyleScore(a, b);
        int moveInScore    = calculateMoveInScore(a, b);
        int genderScore    = calculateGenderScore(a, b);

        double totalScore = budgetScore + lifestyleScore + moveInScore + genderScore;

        // Nếu cùng thành phố nhưng khác quận/huyện, giảm 20% điểm tương hợp
        if (!isSameDistrict(a.getPreferredArea(), b.getPreferredArea())) {
            totalScore = totalScore * 0.8;
        }

        return BigDecimal.valueOf(totalScore).setScale(2, RoundingMode.HALF_UP);
    }

    private boolean hasAvailableSlot(RoommateProfile holder) {
        if (holder.getMaxOccupants() == null || holder.getCurrentOccupants() == null) {
            return true; // Chưa điền → không phạt, để matching tiến hành
        }
        return holder.getCurrentOccupants() < holder.getMaxOccupants();
    }

    public boolean isSameDistrict(String areaA, String areaB) {
        if (areaA == null || areaB == null || areaA.trim().isEmpty() || areaB.trim().isEmpty()) {
            return true;
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
        if (gap <= 1000000L) {
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

        if (a.getGender().trim().equalsIgnoreCase(b.getGender().trim())) {
            return 10;
        }

        return 0;
    }

    public boolean isLocationCompatible(String areaA, String areaB) {
        boolean isBlankA = areaA == null || areaA.trim().isEmpty();
        boolean isBlankB = areaB == null || areaB.trim().isEmpty();

        if (isBlankA && isBlankB) {
            return true;
        }
        if (isBlankA || isBlankB) {
            return false;
        }

        String normA = normalizeLocation(areaA);
        String normB = normalizeLocation(areaB);

        String[] wordsA = normA.split("\\s+");
        String[] wordsB = normB.split("\\s+");

        Set<String> setA = filterStopWords(wordsA);
        Set<String> setB = filterStopWords(wordsB);

        if (setA.isEmpty() || setB.isEmpty()) {
            return normA.contains(normB) || normB.contains(normA);
        }

        Set<String> intersection = new HashSet<>(setA);
        intersection.retainAll(setB);

        return !intersection.isEmpty();
    }

    private String normalizeLocation(String input) {
        if (input == null) return "";
        String normalized = java.text.Normalizer.normalize(input, java.text.Normalizer.Form.NFD);
        normalized = normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        normalized = normalized.toLowerCase().replace('đ', 'd');

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

        return normalized.replaceAll("[^a-z0-9\\s]", " ").trim();
    }

    private Set<String> filterStopWords(String[] words) {
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
