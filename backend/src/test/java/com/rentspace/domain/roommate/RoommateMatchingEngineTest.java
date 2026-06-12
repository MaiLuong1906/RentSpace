package com.rentspace.domain.roommate;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import static org.junit.jupiter.api.Assertions.*;

class RoommateMatchingEngineTest {

    private RoommateMatchingEngine matchingEngine;

    @BeforeEach
    void setUp() {
        matchingEngine = new RoommateMatchingEngine();
    }

    @Test
    void testCalculateMatchScore_PerfectMatch() {
        RoommateProfile a = RoommateProfile.builder()
                .gender("Male")
                .budgetMin(1000000L)
                .budgetMax(3000000L)
                .moveInDate(LocalDate.now())
                .lifestyleTags(Arrays.asList("Quiet", "Non-smoker", "Clean"))
                .build();

        RoommateProfile b = RoommateProfile.builder()
                .gender("Male")
                .budgetMin(1500000L)
                .budgetMax(2500000L) // Giao khoảng ngân sách (40đ)
                .moveInDate(LocalDate.now().plusDays(2)) // Trong vòng 15 ngày (20đ)
                .lifestyleTags(Arrays.asList("Quiet", "Non-smoker", "Clean")) // Trùng tuyệt đối (30đ)
                .build();

        BigDecimal score = matchingEngine.calculateMatchScore(a, b);
        // Budget (40) + Lifestyle (30) + MoveIn (20) + Gender (10) = 100đ
        assertEquals(new BigDecimal("100.00"), score);
    }

    @Test
    void testCalculateMatchScore_PartialMatch() {
        RoommateProfile a = RoommateProfile.builder()
                .gender("Male")
                .budgetMin(1000000L)
                .budgetMax(2000000L)
                .moveInDate(LocalDate.now())
                .lifestyleTags(Arrays.asList("Quiet", "Non-smoker"))
                .build();

        RoommateProfile b = RoommateProfile.builder()
                .gender("Female") // Khác giới tính (0đ)
                .budgetMin(2500000L)
                .budgetMax(3000000L) // Chênh lệch 500k <= 1M (20đ)
                .moveInDate(LocalDate.now().plusDays(20)) // Trong vòng 30 ngày (10đ)
                .lifestyleTags(Arrays.asList("Quiet", "Smoker")) // Trùng 1/3 tag (10đ)
                .build();

        BigDecimal score = matchingEngine.calculateMatchScore(a, b);
        // Budget (20) + Lifestyle (10) + MoveIn (10) + Gender (0) = 40đ
        assertEquals(new BigDecimal("40.00"), score);
    }

    @Test
    void testCalculateMatchScore_NoMatch() {
        RoommateProfile a = RoommateProfile.builder()
                .gender("Male")
                .budgetMin(1000000L)
                .budgetMax(2000000L)
                .moveInDate(LocalDate.now())
                .lifestyleTags(Arrays.asList("Quiet"))
                .build();

        RoommateProfile b = RoommateProfile.builder()
                .gender("Female")
                .budgetMin(3500000L)
                .budgetMax(5000000L) // Chênh lệch 1.5M > 1M (0đ)
                .moveInDate(LocalDate.now().plusDays(40)) // > 30 ngày (0đ)
                .lifestyleTags(Arrays.asList("Loud")) // Trùng 0 tag (0đ)
                .build();

        BigDecimal score = matchingEngine.calculateMatchScore(a, b);
        // Toàn bộ = 0đ
        assertEquals(new BigDecimal("0.00"), score);
    }

    @Test
    void testCalculateMatchScore_LocationMismatch_ShouldReturnZero() {
        RoommateProfile a = RoommateProfile.builder()
                .gender("Male")
                .budgetMin(1000000L)
                .budgetMax(3000000L)
                .moveInDate(LocalDate.now())
                .preferredArea("Ngũ Hành Sơn, Đà Nẵng")
                .lifestyleTags(Arrays.asList("Quiet"))
                .build();

        RoommateProfile b = RoommateProfile.builder()
                .gender("Male")
                .budgetMin(1500000L)
                .budgetMax(2500000L)
                .moveInDate(LocalDate.now())
                .preferredArea("Quận 1, TP. HCM") // Khác thành phố hoàn toàn
                .lifestyleTags(Arrays.asList("Quiet"))
                .build();

        BigDecimal score = matchingEngine.calculateMatchScore(a, b);
        // Do khác địa lý nên điểm số bị đặt về 0.00 ngay lập tức
        assertEquals(new BigDecimal("0.00"), score);
    }

    @Test
    void testCalculateMatchScore_LocationMatchNormal_ShouldCalculateNormally() {
        RoommateProfile a = RoommateProfile.builder()
                .gender("Male")
                .budgetMin(1000000L)
                .budgetMax(3000000L)
                .moveInDate(LocalDate.now())
                .preferredArea("Ngu Hanh Son, Da Nang")
                .lifestyleTags(Arrays.asList("Quiet"))
                .build();

        RoommateProfile b = RoommateProfile.builder()
                .gender("Male")
                .budgetMin(1500000L)
                .budgetMax(2500000L)
                .moveInDate(LocalDate.now())
                .preferredArea("Hòa Khánh, Liên Chiểu, đà nẵng") // Cùng thành phố Đà Nẵng
                .lifestyleTags(Arrays.asList("Quiet"))
                .build();

        BigDecimal score = matchingEngine.calculateMatchScore(a, b);
        // Do cùng thành phố Đà Nẵng nên địa lý hợp lệ, điểm số được tính bình thường
        assertTrue(score.compareTo(BigDecimal.ZERO) > 0);
    }

    @Test
    void testCalculateMatchScore_SameCityDifferentDistrict_ShouldApplyPenalty() {
        RoommateProfile a = RoommateProfile.builder()
                .gender("Male")
                .budgetMin(1000000L)
                .budgetMax(3000000L)
                .moveInDate(LocalDate.now())
                .preferredArea("Quận 1, Hồ Chí Minh")
                .lifestyleTags(Arrays.asList("Quiet", "Non-smoker", "Clean"))
                .build();

        RoommateProfile b = RoommateProfile.builder()
                .gender("Male")
                .budgetMin(1500000L)
                .budgetMax(2500000L)
                .moveInDate(LocalDate.now().plusDays(2))
                .preferredArea("Quận 12, Hồ Chí Minh") // Khác quận, cùng thành phố
                .lifestyleTags(Arrays.asList("Quiet", "Non-smoker", "Clean"))
                .build();

        BigDecimal score = matchingEngine.calculateMatchScore(a, b);
        // Điểm thô: Budget (40) + Lifestyle (30) + MoveIn (20) + Gender (10) = 100đ
        // Do khác quận nên giảm 20% còn 80.00
        assertEquals(new BigDecimal("80.00"), score);
    }
}
