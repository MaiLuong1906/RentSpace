package com.rentspace.domain.kyc;

import com.rentspace.domain.user.CustomUserDetails;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import com.rentspace.domain.user.enums.KycStatus;
import com.rentspace.domain.user.enums.Role;
import com.rentspace.infrastructure.security.JwtTokenProvider;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AdminKycSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User adminUser;
    private User tenantUser;
    private User landlordUser;

    private String adminToken;
    private String tenantToken;
    private String landlordToken;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        // 1. Tạo tài khoản Admin
        adminUser = User.builder()
                .email("admin_" + UUID.randomUUID() + "@example.com")
                .password("password123")
                .fullName("Admin User")
                .role(Role.ADMIN)
                .kycStatus(KycStatus.VERIFIED)
                .isActive(true)
                .isEmailVerified(true)
                .build();
        adminUser = userRepository.save(adminUser);
        adminToken = jwtTokenProvider.generateAccessToken(new CustomUserDetails(adminUser));

        // 2. Tạo tài khoản Tenant (Role USER thường)
        tenantUser = User.builder()
                .email("tenant_" + UUID.randomUUID() + "@example.com")
                .password("password123")
                .fullName("Tenant User")
                .role(Role.TENANT)
                .kycStatus(KycStatus.VERIFIED)
                .isActive(true)
                .isEmailVerified(true)
                .build();
        tenantUser = userRepository.save(tenantUser);
        tenantToken = jwtTokenProvider.generateAccessToken(new CustomUserDetails(tenantUser));

        // 3. Tạo tài khoản Landlord
        landlordUser = User.builder()
                .email("landlord_" + UUID.randomUUID() + "@example.com")
                .password("password123")
                .fullName("Landlord User")
                .role(Role.LANDLORD)
                .kycStatus(KycStatus.VERIFIED)
                .isActive(true)
                .isEmailVerified(true)
                .build();
        landlordUser = userRepository.save(landlordUser);
        landlordToken = jwtTokenProvider.generateAccessToken(new CustomUserDetails(landlordUser));
    }

    @AfterEach
    void tearDown() {
        userRepository.deleteAll();
    }

    @Test
    void whenRequestWithoutJwt_shouldReturn401() throws Exception {
        mockMvc.perform(get("/api/v1/admin/kyc")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void whenRequestWithTenantJwt_shouldReturn403() throws Exception {
        mockMvc.perform(get("/api/v1/admin/kyc")
                        .header("Authorization", "Bearer " + tenantToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    void whenRequestWithLandlordJwt_shouldReturn403() throws Exception {
        mockMvc.perform(get("/api/v1/admin/kyc")
                        .header("Authorization", "Bearer " + landlordToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    void whenRequestWithAdminJwt_shouldReturn200() throws Exception {
        mockMvc.perform(get("/api/v1/admin/kyc")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }
}
