package com.rentspace.domain.roommate;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.rentspace.common.response.ApiResponse;
import com.rentspace.domain.roommate.dto.RoommateMatchResponse;
import com.rentspace.domain.roommate.dto.RoommateProfileRequest;
import com.rentspace.domain.roommate.dto.RoommateProfileResponse;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class RoommateControllerTest {

    private MockMvc mockMvc;

    @Mock
    private RoommateService roommateService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private RoommateController roommateController;

    private ObjectMapper objectMapper;
    private User mockUser;

    @BeforeEach
    void setUp() {
        // Mock authentication principal resolver
        HandlerMethodArgumentResolver mockAuthPrincipalResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.hasParameterAnnotation(org.springframework.security.core.annotation.AuthenticationPrincipal.class)
                        || UserDetails.class.isAssignableFrom(parameter.getParameterType());
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return new org.springframework.security.core.userdetails.User("tenant@example.com", "password", Collections.emptyList());
            }
        };

        mockMvc = MockMvcBuilders.standaloneSetup(roommateController)
                .setCustomArgumentResolvers(mockAuthPrincipalResolver)
                .build();

        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        // Mock User Entity
        mockUser = new User();
        mockUser.setId(1L);
        mockUser.setEmail("tenant@example.com");
        mockUser.setFullName("Nguyen Van A");
    }

    @Test
    void getProfile_ShouldReturnProfile() throws Exception {
        // Given
        RoommateProfileResponse response = RoommateProfileResponse.builder()
                .id(10L)
                .userId(1L)
                .fullName("Nguyen Van A")
                .gender("Male")
                .occupation("Student")
                .budgetMin(1500000L)
                .budgetMax(3000000L)
                .isActive(true)
                .build();

        when(userRepository.findByEmail("tenant@example.com")).thenReturn(Optional.of(mockUser));
        when(roommateService.getProfile(mockUser)).thenReturn(response);

        // When & Then
        mockMvc.perform(get("/api/v1/roommates/profile"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Lấy hồ sơ thành công"))
                .andExpect(jsonPath("$.data.id").value(10))
                .andExpect(jsonPath("$.data.fullName").value("Nguyen Van A"))
                .andExpect(jsonPath("$.data.gender").value("Male"))
                .andExpect(jsonPath("$.data.isActive").value(true));
    }

    @Test
    void updateProfile_ShouldReturnUpdatedProfile() throws Exception {
        // Given
        RoommateProfileRequest request = new RoommateProfileRequest();
        request.setGender("Male");
        request.setOccupation("Student");
        request.setBudgetMin(1500000L);
        request.setBudgetMax(3000000L);
        request.setPreferredArea("District 1");
        request.setMoveInDate(LocalDate.now().plusDays(5));
        request.setLifestyleTags(List.of("Clean", "Quiet"));
        request.setBio("Hello, looking for a roommate!");
        request.setIsActive(true);

        RoommateProfileResponse response = RoommateProfileResponse.builder()
                .id(10L)
                .userId(1L)
                .fullName("Nguyen Van A")
                .gender("Male")
                .occupation("Student")
                .budgetMin(1500000L)
                .budgetMax(3000000L)
                .isActive(true)
                .build();

        when(userRepository.findByEmail("tenant@example.com")).thenReturn(Optional.of(mockUser));
        when(roommateService.updateProfile(any(RoommateProfileRequest.class), eq(mockUser))).thenReturn(response);

        // When & Then
        mockMvc.perform(put("/api/v1/roommates/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Cập nhật hồ sơ thành công"))
                .andExpect(jsonPath("$.data.id").value(10))
                .andExpect(jsonPath("$.data.budgetMax").value(3000000));
    }

    @Test
    void getSuggestions_ShouldReturnSuggestionsList() throws Exception {
        // Given
        RoommateMatchResponse matchResponse = RoommateMatchResponse.builder()
                .id(5L)
                .matchScore(java.math.BigDecimal.valueOf(85.50))
                .status("SUGGESTED")
                .build();

        when(userRepository.findByEmail("tenant@example.com")).thenReturn(Optional.of(mockUser));
        when(roommateService.getSuggestions(mockUser)).thenReturn(List.of(matchResponse));

        // When & Then
        mockMvc.perform(get("/api/v1/roommates/suggestions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Lấy danh sách gợi ý thành công"))
                .andExpect(jsonPath("$.data[0].id").value(5))
                .andExpect(jsonPath("$.data[0].matchScore").value(85.50))
                .andExpect(jsonPath("$.data[0].status").value("SUGGESTED"));
    }

    @Test
    void dismissMatch_ShouldReturnSuccess() throws Exception {
        // Given
        when(userRepository.findByEmail("tenant@example.com")).thenReturn(Optional.of(mockUser));
        doNothing().when(roommateService).dismissMatch(eq(50L), eq(mockUser));

        // When & Then
        mockMvc.perform(patch("/api/v1/roommates/matches/50/dismiss"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Đã từ chối gợi ý thành công"));
    }
}
