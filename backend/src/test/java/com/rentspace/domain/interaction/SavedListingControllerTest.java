package com.rentspace.domain.interaction;

import com.rentspace.domain.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import com.rentspace.domain.interaction.dto.SaveToggleResponse;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Optional;

import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class SavedListingControllerTest {

    private MockMvc mockMvc;

    @Mock private SavedListingService savedListingService;
    @Mock private UserRepository userRepository;

    @InjectMocks
    private SavedListingController savedListingController;

    private com.rentspace.domain.user.User mockUser;

    @BeforeEach
    void setUp() {
        mockUser = org.mockito.Mockito.mock(com.rentspace.domain.user.User.class);
        when(mockUser.getId()).thenReturn(1L);

        // Resolver giả lập user đã đăng nhập
        HandlerMethodArgumentResolver authResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.hasParameterAnnotation(AuthenticationPrincipal.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return new User("tenant@example.com", "password", Collections.emptyList());
            }
        };

        mockMvc = MockMvcBuilders.standaloneSetup(savedListingController)
                .setCustomArgumentResolvers(authResolver, new PageableHandlerMethodArgumentResolver())
                .build();
    }

    // ===== toggleSave =====

    @Test
    void toggleSave_shouldReturn200_withSaveToggleResponse() throws Exception {
        when(userRepository.findByEmail("tenant@example.com")).thenReturn(Optional.of(mockUser));
        when(savedListingService.toggleSave(1L, 10L))
                .thenReturn(new SaveToggleResponse(true, 5));

        mockMvc.perform(post("/api/v1/saved-listings/10")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isSaved").value(true))
                .andExpect(jsonPath("$.data.totalSaves").value(5));
    }

    @Test
    void toggleSave_unsave_shouldReturnFalse() throws Exception {
        when(userRepository.findByEmail("tenant@example.com")).thenReturn(Optional.of(mockUser));
        when(savedListingService.toggleSave(1L, 20L))
                .thenReturn(new SaveToggleResponse(false, 0));

        mockMvc.perform(post("/api/v1/saved-listings/20")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isSaved").value(false))
                .andExpect(jsonPath("$.data.totalSaves").value(0));
    }

    // ===== getSavedListings =====

    @Test
    void getSavedListings_shouldReturn200_withEmptyPage() throws Exception {
        when(userRepository.findByEmail("tenant@example.com")).thenReturn(Optional.of(mockUser));
        when(savedListingService.getSavedListings(eq(1L), any()))
                .thenReturn(new PageImpl<>(new ArrayList<>(), PageRequest.of(0, 12), 0));

        mockMvc.perform(get("/api/v1/saved-listings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").exists());
    }

    // ===== checkSavedStatus =====

    @Test
    void checkSavedStatus_shouldReturn200_withTrueWhenSaved() throws Exception {
        when(userRepository.findByEmail("tenant@example.com")).thenReturn(Optional.of(mockUser));
        when(savedListingService.isSaved(1L, 10L)).thenReturn(true);

        mockMvc.perform(get("/api/v1/saved-listings/10/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value(true));
    }

    @Test
    void checkSavedStatus_shouldReturn200_withFalseWhenNotSaved() throws Exception {
        when(userRepository.findByEmail("tenant@example.com")).thenReturn(Optional.of(mockUser));
        when(savedListingService.isSaved(1L, 99L)).thenReturn(false);

        mockMvc.perform(get("/api/v1/saved-listings/99/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value(false));
    }
}
