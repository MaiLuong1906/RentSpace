package com.rentspace.config;

import com.rentspace.infrastructure.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final UserDetailsService userDetailsService;

    // Các endpoint hoàn toàn public (không cần đăng nhập)
    private static final String[] PUBLIC_ENDPOINTS = {
            "/api/v1/auth/**",
            "/api/v1/users/{userId}",       // Public - xem hồ sơ công khai
            "/api/v1/deposits/webhook/vnpay", // VNPay IPN callback (Public)
            "/api/v1/listings/*/view",      // Public - ghi nhận lượt xem (cho phép cả ẩn danh)
            "/api/v1/listings/search/geo",  // Public - tìm kiếm địa lý không gian (cho phép cả ẩn danh)
            "/api/v1/subscriptions/plans",  // Public - xem gói cước
            "/api/v1/seo/pages",            // Public - frontend đọc SEO metadata cho ISR pages
            "/api/v1/interactions/track",   // Public - anonymous tracking được phép (JWT optional)
            "/sitemap.xml",                 // Public - Google/Bing bot crawl
            "/uploads/**",                  // Static files (ảnh upload local)
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/v3/api-docs/**",
            "/actuator/health",
            "/ws/**"
    };

    // Các endpoint GET của listings public (không cần đăng nhập để xem)
    private static final String[] PUBLIC_LISTING_GET_ENDPOINTS = {
            "/api/v1/listings",             // GET - tìm kiếm
            "/api/v1/listings/nearby",      // GET - tìm gần đây
            "/api/v1/listings/*",           // GET - xem chi tiết
            "/api/v1/listings/*/reviews"    // GET - xem reviews của listing
    };

    // Các endpoint GET của posts public
    private static final String[] PUBLIC_POST_GET_ENDPOINTS = {
            "/api/v1/posts",
            "/api/v1/posts/*",
            "/api/v1/posts/*/comments"
    };

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(PUBLIC_ENDPOINTS).permitAll()
                        // GET listings/posts public, nhưng POST/PUT/PATCH/DELETE phải authenticate
                        .requestMatchers(org.springframework.http.HttpMethod.GET, PUBLIC_LISTING_GET_ENDPOINTS).permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, PUBLIC_POST_GET_ENDPOINTS).permitAll()
                        // Admin routes (dùng @PreAuthorize bổ sung tại controller)
                        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/v1/kyc/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated())
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(new org.springframework.security.web.authentication.HttpStatusEntryPoint(org.springframework.http.HttpStatus.UNAUTHORIZED))
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}
