package com.rentspace.domain.deposit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.rentspace.domain.deposit.dto.DepositRequest;
import com.rentspace.domain.deposit.dto.DepositResponse;
import com.rentspace.domain.deposit.enums.DepositStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.time.LocalDate;
import java.util.Collections;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class DepositControllerTest {

    private MockMvc mockMvc;

    @Mock
    private DepositService depositService;

    @InjectMocks
    private DepositController depositController;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        // Mocking the @AuthenticationPrincipal parameter resolver for standalone setup
        HandlerMethodArgumentResolver mockAuthPrincipalResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.hasParameterAnnotation(org.springframework.security.core.annotation.AuthenticationPrincipal.class)
                        || UserDetails.class.isAssignableFrom(parameter.getParameterType());
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return new User("tenant@example.com", "password", Collections.emptyList());
            }
        };

        mockMvc = MockMvcBuilders.standaloneSetup(depositController)
                .setCustomArgumentResolvers(mockAuthPrincipalResolver)
                .build();
                
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    void createDeposit_ShouldReturnOk() throws Exception {
        // Given
        DepositRequest request = new DepositRequest();
        request.setListingId(100L);
        request.setAmount(5000000L);
        request.setMoveInDate(LocalDate.now().plusDays(10));
        request.setNotes("Test deposit notes");

        DepositResponse response = DepositResponse.builder()
                .id(10L)
                .listingId(100L)
                .amount(5000000L)
                .status(DepositStatus.PENDING_PAYMENT)
                .build();

        when(depositService.createDeposit(any(DepositRequest.class), any())).thenReturn(response);

        // When & Then
        mockMvc.perform(post("/api/v1/deposits")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(10))
                .andExpect(jsonPath("$.data.amount").value(5000000));
    }

    @Test
    void initiatePayment_ShouldReturnPaymentUrl() throws Exception {
        // Given
        when(depositService.initiatePayment(eq(10L), any(), any())).thenReturn("http://vnpay.vn/payment");

        // When & Then
        mockMvc.perform(post("/api/v1/deposits/10/initiate-payment")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.paymentUrl").value("http://vnpay.vn/payment"));
    }

    @Test
    void vnpayWebhook_ShouldReturnVnpayResponseMap() throws Exception {
        // Given
        Map<String, String> expectedResponse = Map.of("RspCode", "00", "Message", "Confirm Success");
        when(depositService.processVnpayWebhook(anyMap())).thenReturn(expectedResponse);

        // When & Then
        mockMvc.perform(get("/api/v1/deposits/webhook/vnpay")
                        .param("vnp_TxnRef", "10")
                        .param("vnp_ResponseCode", "00"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.RspCode").value("00"))
                .andExpect(jsonPath("$.Message").value("Confirm Success"));
    }
}
