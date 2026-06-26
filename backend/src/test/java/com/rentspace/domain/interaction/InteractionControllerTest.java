package com.rentspace.domain.interaction;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rentspace.domain.interaction.dto.InteractionTrackRequest;
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

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class InteractionControllerTest {

    // MockMvc cho anonymous user (resolver trả về null)
    private MockMvc anonymousMockMvc;
    // MockMvc cho authenticated user
    private MockMvc authenticatedMockMvc;

    @Mock
    private InteractionTrackingService interactionTrackingService;

    @InjectMocks
    private InteractionController interactionController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        // Anonymous: resolver trả null → email = null trong controller
        HandlerMethodArgumentResolver anonResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.hasParameterAnnotation(AuthenticationPrincipal.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return null;
            }
        };

        // Authenticated: resolver trả UserDetails thật
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

        anonymousMockMvc = MockMvcBuilders.standaloneSetup(interactionController)
                .setCustomArgumentResolvers(anonResolver)
                .build();

        authenticatedMockMvc = MockMvcBuilders.standaloneSetup(interactionController)
                .setCustomArgumentResolvers(authResolver)
                .build();
    }

    private String viewRequestBody() throws Exception {
        return objectMapper.writeValueAsString(
                new InteractionTrackRequest(42L, InteractionType.VIEW, 15, "DIRECT", "session-uuid"));
    }

    // ===== Anonymous =====

    @Test
    void track_anonymous_shouldReturn204_andCallTrackWithNullEmail() throws Exception {
        anonymousMockMvc.perform(post("/api/v1/interactions/track")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(viewRequestBody()))
                .andExpect(status().isNoContent());

        // email = null khi không có JWT
        verify(interactionTrackingService).track(isNull(), any(InteractionTrackRequest.class));
    }

    @Test
    void track_anonymous_shareEvent_shouldReturn204() throws Exception {
        String body = objectMapper.writeValueAsString(
                new InteractionTrackRequest(42L, InteractionType.SHARE, null, "DIRECT", "sess-1"));

        anonymousMockMvc.perform(post("/api/v1/interactions/track")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNoContent());
    }

    // ===== Authenticated =====

    @Test
    void track_authenticated_shouldReturn204_andCallTrackWithEmail() throws Exception {
        authenticatedMockMvc.perform(post("/api/v1/interactions/track")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(viewRequestBody()))
                .andExpect(status().isNoContent());

        verify(interactionTrackingService).track(
                org.mockito.ArgumentMatchers.eq("user@example.com"),
                any(InteractionTrackRequest.class));
    }

    // ===== Validation =====

    @Test
    void track_missingListingId_shouldReturn400() throws Exception {
        // listingId là @NotNull → thiếu thì trả 400
        String invalidBody = "{\"type\":\"VIEW\",\"sessionId\":\"s1\"}";

        anonymousMockMvc.perform(post("/api/v1/interactions/track")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidBody))
                .andExpect(status().isBadRequest());
    }
}
