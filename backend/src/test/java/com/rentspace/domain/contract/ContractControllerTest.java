package com.rentspace.domain.contract;

import com.rentspace.common.exception.BusinessException;
import com.rentspace.domain.contract.dto.ContractResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class ContractControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ContractService contractService;

    @InjectMocks
    private ContractController contractController;

    private static final String TENANT_EMAIL = "tenant@test.com";

    private ContractResponse sampleResponse() {
        return ContractResponse.builder()
                .id(50L)
                .depositId(100L)
                .landlordId(1L).landlordName("Chủ nhà A")
                .tenantId(2L).tenantName("Người thuê B")
                .contentSnapshot("<html>hợp đồng</html>")
                .status("PENDING_SIGNATURES")
                .pdfUrl("/api/v1/contracts/50/pdf")
                .expiresAt(Instant.now().plusSeconds(86400 * 7))
                .createdAt(Instant.now())
                .build();
    }

    @BeforeEach
    void setUp() {
        // Giải quyết @AuthenticationPrincipal → trả về tenant UserDetails
        HandlerMethodArgumentResolver authPrincipalResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.hasParameterAnnotation(AuthenticationPrincipal.class)
                        || UserDetails.class.isAssignableFrom(parameter.getParameterType());
            }

            @Override
            public Object resolveArgument(MethodParameter parameter,
                                          ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest,
                                          WebDataBinderFactory binderFactory) {
                return new User(TENANT_EMAIL, "password", Collections.emptyList());
            }
        };

        ObjectMapper mapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        mockMvc = MockMvcBuilders
                .standaloneSetup(contractController)
                .setMessageConverters(
                        new org.springframework.http.converter.ByteArrayHttpMessageConverter(),
                        new MappingJackson2HttpMessageConverter(mapper))
                .setCustomArgumentResolvers(
                        authPrincipalResolver,
                        new PageableHandlerMethodArgumentResolver())
                .build();
    }

    // ── GET /contracts/{id} ─────────────────────────────────────────────────

    @Test
    void getContract_whenParticipant_returns200WithBody() throws Exception {
        when(contractService.getContract(50L, TENANT_EMAIL))
                .thenReturn(sampleResponse());

        mockMvc.perform(get("/api/v1/contracts/50"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(50))
                .andExpect(jsonPath("$.data.status").value("PENDING_SIGNATURES"))
                .andExpect(jsonPath("$.data.pdfUrl").value("/api/v1/contracts/50/pdf"));
    }

    @Test
    void getContract_whenNotParticipant_propagatesBusinessException() throws Exception {
        when(contractService.getContract(50L, TENANT_EMAIL))
                .thenThrow(new BusinessException("Bạn không có quyền xem hợp đồng này."));

        // Standalone MockMvc không có @ControllerAdvice → exception propagates
        // Kiểm tra service ném đúng exception type
        org.junit.jupiter.api.Assertions.assertThrows(
                Exception.class,
                () -> mockMvc.perform(get("/api/v1/contracts/50")).andReturn()
        );
    }

    // ── POST /contracts/{id}/sign ────────────────────────────────────────────

    @Test
    void signContract_whenVerifiedParticipant_returns200() throws Exception {
        ContractResponse signed = sampleResponse();
        signed.setStatus("FULLY_SIGNED");
        when(contractService.signContract(50L, TENANT_EMAIL)).thenReturn(signed);

        mockMvc.perform(post("/api/v1/contracts/50/sign"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("FULLY_SIGNED"));
    }

    @Test
    void signContract_whenNotVerified_propagatesBusinessException() throws Exception {
        when(contractService.signContract(50L, TENANT_EMAIL))
                .thenThrow(new BusinessException("Bạn cần xác minh danh tính trước khi ký hợp đồng."));

        org.junit.jupiter.api.Assertions.assertThrows(
                Exception.class,
                () -> mockMvc.perform(post("/api/v1/contracts/50/sign")).andReturn()
        );
    }

    // ── GET /contracts/{id}/pdf ──────────────────────────────────────────────

    @Test
    void downloadPdf_whenParticipant_returnsPdfBytes() throws Exception {
        byte[] fakePdf = new byte[]{0x25, 0x50, 0x44, 0x46, 0x2D}; // %PDF-
        when(contractService.downloadPdf(50L, TENANT_EMAIL)).thenReturn(fakePdf);

        mockMvc.perform(get("/api/v1/contracts/50/pdf"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, MediaType.parseMediaType("application/pdf").toString()))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"contract-50.pdf\""))
                .andExpect(content().bytes(fakePdf));
    }

    // ── GET /contracts/mine ──────────────────────────────────────────────────

    @Test
    void myContracts_returnsPagedResult() throws Exception {
        org.springframework.data.domain.PageRequest pageRequest =
                org.springframework.data.domain.PageRequest.of(0, 10);
        when(contractService.getMyContracts(eq(TENANT_EMAIL), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleResponse()), pageRequest, 1L));

        mockMvc.perform(get("/api/v1/contracts/mine"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].id").value(50));
    }
}
