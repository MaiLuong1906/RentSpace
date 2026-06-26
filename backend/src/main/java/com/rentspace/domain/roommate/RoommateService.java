package com.rentspace.domain.roommate;

import com.rentspace.domain.roommate.dto.RoommateMatchResponse;
import com.rentspace.domain.roommate.dto.RoommateProfileRequest;
import com.rentspace.domain.roommate.dto.RoommateProfileResponse;
import com.rentspace.domain.user.User;

import java.util.List;

public interface RoommateService {

    RoommateProfileResponse getProfile(User currentUser);

    RoommateProfileResponse updateProfile(RoommateProfileRequest request, User currentUser);

    List<RoommateMatchResponse> getSuggestions(User currentUser);

    void dismissMatch(Long matchId, User currentUser);

    /** Bày tỏ sự quan tâm đến một gợi ý. Khi cả hai bên đều quan tâm → status chuyển CONTACTED */
    RoommateMatchResponse expressInterest(Long matchId, User currentUser);
}
