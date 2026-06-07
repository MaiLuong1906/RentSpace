package com.rentspace.config;

import java.security.Principal;

/**
 * Đối tượng Principal đại diện cho một phiên kết nối WebSocket (STOMP).
 * Sử dụng User ID dạng String làm định danh chính.
 */
public class StompPrincipal implements Principal {
    private final String name;

    public StompPrincipal(String name) {
        this.name = name;
    }

    @Override
    public String getName() {
        return name;
    }
}
