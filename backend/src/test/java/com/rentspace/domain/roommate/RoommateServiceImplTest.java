package com.rentspace.domain.roommate;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rentspace.common.exception.BusinessException;
import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.domain.roommate.dto.RoommateMatchResponse;
import com.rentspace.domain.roommate.dto.RoommateProfileRequest;
import com.rentspace.domain.roommate.dto.RoommateProfileResponse;
import com.rentspace.domain.roommate.enums.MatchStatus;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.enums.KycStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoommateServiceImplTest {

    @Mock
    private RoommateProfileRepository profileRepository;

    @Mock
    private RoommateMatchRepository matchRepository;

    @Mock
    private RoommateMapper roommateMapper;

    @Mock
    private RoommateMatchingEngine matchingEngine;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private RoommateServiceImpl roommateService;

    private User currentUser;
    private RoommateProfile myProfile;

    @BeforeEach
    void setUp() {
        currentUser = new User();
        currentUser.setId(1L);
        currentUser.setEmail("tenant@example.com");
        currentUser.setKycStatus(KycStatus.VERIFIED);

        myProfile = RoommateProfile.builder()
                .id(10L)
                .user(currentUser)
                .isActive(true)
                .build();
    }

    @Test
    void getProfile_ExistingProfile_ShouldReturnResponse() {
        when(profileRepository.findByUserId(1L)).thenReturn(Optional.of(myProfile));
        RoommateProfileResponse expectedResponse = RoommateProfileResponse.builder().id(10L).build();
        when(roommateMapper.toResponse(myProfile)).thenReturn(expectedResponse);

        RoommateProfileResponse response = roommateService.getProfile(currentUser);

        assertNotNull(response);
        assertEquals(10L, response.getId());
    }

    @Test
    void getProfile_NonExistingProfile_ShouldThrowException() {
        when(profileRepository.findByUserId(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> roommateService.getProfile(currentUser));
    }

    @Test
    void updateProfile_UnverifiedKyc_ShouldThrowException() {
        currentUser.setKycStatus(KycStatus.PENDING);
        RoommateProfileRequest request = new RoommateProfileRequest();

        assertThrows(BusinessException.class, () -> roommateService.updateProfile(request, currentUser));
    }

    @Test
    void updateProfile_ExistingProfile_ShouldUpdateAndReturnResponse() {
        RoommateProfileRequest request = new RoommateProfileRequest();
        request.setIsActive(true);

        when(profileRepository.findByUserId(1L)).thenReturn(Optional.of(myProfile));
        doNothing().when(roommateMapper).updateEntityFromRequest(request, myProfile);
        when(profileRepository.save(myProfile)).thenReturn(myProfile);
        when(redisTemplate.delete(anyString())).thenReturn(true);
        when(roommateMapper.toResponse(myProfile)).thenReturn(RoommateProfileResponse.builder().id(10L).isActive(true).build());

        RoommateProfileResponse response = roommateService.updateProfile(request, currentUser);

        assertNotNull(response);
        assertTrue(response.getIsActive());
        verify(profileRepository).save(myProfile);
        verify(redisTemplate).delete("roommate:suggestions:1");
    }

    @Test
    void getSuggestions_CacheHit_ShouldReturnCachedList() throws Exception {
        String cacheKey = "roommate:suggestions:1";
        String cachedJson = "[{\"id\":5,\"matchScore\":80.00}]";
        List<RoommateMatchResponse> cachedList = List.of(RoommateMatchResponse.builder().id(5L).matchScore(BigDecimal.valueOf(80.0)).build());

        when(profileRepository.findByUserId(1L)).thenReturn(Optional.of(myProfile));
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(cacheKey)).thenReturn(cachedJson);
        when(objectMapper.readValue(eq(cachedJson), any(TypeReference.class))).thenReturn(cachedList);

        List<RoommateMatchResponse> result = roommateService.getSuggestions(currentUser);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(5L, result.get(0).getId());
        verifyNoInteractions(matchRepository);
    }

    @Test
    void getSuggestions_CacheMiss_ShouldCalculateSaveAndCache() throws Exception {
        String cacheKey = "roommate:suggestions:1";
        
        User otherUser = new User();
        otherUser.setId(2L);
        otherUser.setKycStatus(KycStatus.VERIFIED);
        
        RoommateProfile otherProfile = RoommateProfile.builder()
                .id(20L)
                .user(otherUser)
                .isActive(true)
                .build();

        when(profileRepository.findByUserId(1L)).thenReturn(Optional.of(myProfile));
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(cacheKey)).thenReturn(null); // Cache miss
        when(profileRepository.findActiveProfilesForMatching(1L)).thenReturn(List.of(otherProfile));
        
        // No existing match in DB
        when(matchRepository.findMatchBetween(10L, 20L)).thenReturn(Optional.empty());
        when(matchingEngine.calculateMatchScore(myProfile, otherProfile)).thenReturn(BigDecimal.valueOf(75.0));

        RoommateMatch match = RoommateMatch.builder()
                .profileA(myProfile)
                .profileB(otherProfile)
                .matchScore(BigDecimal.valueOf(75.0))
                .status(MatchStatus.SUGGESTED)
                .build();

        when(matchRepository.findSuggestions(10L)).thenReturn(List.of(match));
        
        RoommateMatchResponse response = RoommateMatchResponse.builder().id(30L).matchScore(BigDecimal.valueOf(75.0)).build();
        when(roommateMapper.toResponse(match)).thenReturn(response);
        when(objectMapper.writeValueAsString(any())).thenReturn("json_data");

        List<RoommateMatchResponse> result = roommateService.getSuggestions(currentUser);

        assertNotNull(result);
        assertEquals(1, result.size());
        verify(matchRepository).saveAll(anyList());
        verify(valueOperations).set(eq(cacheKey), eq("json_data"), eq(1L), any());
    }

    @Test
    void dismissMatch_ShouldSetDismissedAndEvictCache() {
        User userB = new User();
        userB.setId(2L);

        RoommateProfile profileB = RoommateProfile.builder()
                .id(20L)
                .user(userB)
                .build();

        RoommateMatch match = RoommateMatch.builder()
                .id(100L)
                .profileA(myProfile)
                .profileB(profileB)
                .status(MatchStatus.SUGGESTED)
                .build();

        when(matchRepository.findById(100L)).thenReturn(Optional.of(match));
        when(profileRepository.findByUserId(1L)).thenReturn(Optional.of(myProfile));
        when(matchRepository.save(match)).thenReturn(match);
        when(redisTemplate.delete(anyString())).thenReturn(true);

        roommateService.dismissMatch(100L, currentUser);

        assertEquals(MatchStatus.DISMISSED, match.getStatus());
        verify(redisTemplate).delete("roommate:suggestions:1");
        verify(redisTemplate).delete("roommate:suggestions:2");
    }
}
