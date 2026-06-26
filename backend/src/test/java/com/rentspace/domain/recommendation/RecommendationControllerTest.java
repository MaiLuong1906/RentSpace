package com.rentspace.domain.recommendation;

import com.rentspace.domain.recommendation.dto.ListingSummaryDto;
import com.rentspace.domain.listing.enums.RoomType;
import com.rentspace.domain.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class RecommendationControllerTest {

    private MockMvc mockMvc;

    @Mock
    private RecommendationService recommendationService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private RecommendationController recommendationController;

    private com.rentspace.domain.user.User mockUser;
    private List<ListingSummaryDto> sampleResults;

    @BeforeEach
    void setUp() {
        mockUser = org.mockito.Mockito.mock(com.rentspace.domain.user.User.class);

        sampleResults = List.of(
                ListingSummaryDto.builder()
                        .id(10L)
                        .title("Phòng trọ Hải Châu")
                        .district("Hải Châu")
                        .city("Đà Nẵng")
                        .pricePerMonth(new BigDecimal("3000000"))
                        .areaM2(new BigDecimal("20"))
                        .roomType(RoomType.PHONG_TRO)
                        .build()
        );

        HandlerMethodArgumentResolver authResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.hasParameterAnnotation(AuthenticationPrincipal.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return new User("user@example.com", "password", Collections.emptyList());
            }
        };

        mockMvc = MockMvcBuilders.standaloneSetup(recommendationController)
                .setCustomArgumentResolvers(authResolver)
                .build();
    }

    // ===== /similar/{listingId} — public, không cần JWT =====

    @Test
    void getSimilarListings_public_returns200() throws Exception {
        when(recommendationService.getSimilarListings(eq(1L), eq(6)))
                .thenReturn(sampleResults);

        mockMvc.perform(get("/api/v1/recommendations/similar/1")
                        .param("limit", "6")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].id").value(10));
    }

    @Test
    void getSimilarListings_usesDefaultLimit_whenNotProvided() throws Exception {
        when(recommendationService.getSimilarListings(eq(2L), eq(6)))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/v1/recommendations/similar/2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    void getSimilarListings_noResults_returnsEmptyArray() throws Exception {
        when(recommendationService.getSimilarListings(eq(99L), anyInt()))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/v1/recommendations/similar/99"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isEmpty());
    }

    // ===== /for-you — yêu cầu JWT =====

    @Test
    void getForYou_withAuthenticatedUser_returns200() throws Exception {
        when(mockUser.getId()).thenReturn(1L);
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(mockUser));
        when(recommendationService.getForYou(eq(1L), eq(12))).thenReturn(sampleResults);

        mockMvc.perform(get("/api/v1/recommendations/for-you")
                        .param("limit", "12")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].id").value(10));
    }

    @Test
    void getForYou_usesDefaultLimit_whenNotProvided() throws Exception {
        when(mockUser.getId()).thenReturn(1L);
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(mockUser));
        when(recommendationService.getForYou(eq(1L), eq(12))).thenReturn(sampleResults);

        mockMvc.perform(get("/api/v1/recommendations/for-you"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    // ===== /trending — public, không cần JWT =====

    @Test
    void getTrending_public_returns200() throws Exception {
        when(recommendationService.getTrending(eq(12))).thenReturn(sampleResults);

        mockMvc.perform(get("/api/v1/recommendations/trending")
                        .param("limit", "12")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].city").value("Đà Nẵng"));
    }

    @Test
    void getTrending_noData_returnsEmptyArray() throws Exception {
        when(recommendationService.getTrending(anyInt())).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/v1/recommendations/trending"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isEmpty());
    }
}
