package com.rentspace.domain.interaction;

import com.rentspace.domain.interaction.dto.InteractionTrackRequest;

public interface InteractionTrackingService {

    /**
     * Ghi nhận sự kiện tương tác. Fire-and-forget — không block request chính.
     *
     * @param userEmail email của user đã đăng nhập, null nếu anonymous
     * @param request   thông tin sự kiện từ client
     */
    void track(String userEmail, InteractionTrackRequest request);
}
