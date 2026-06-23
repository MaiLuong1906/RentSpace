package com.rentspace.domain.listing.controller;

import com.rentspace.common.response.ApiResponse;
import com.rentspace.domain.listing.PriceSuggestionService;
import com.rentspace.domain.listing.dto.PriceSuggestionResponse;
import com.rentspace.domain.listing.enums.RoomType;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/price-suggestion")
@RequiredArgsConstructor
@Tag(name = "Price Suggestion API", description = "Endpoints gợi ý giá thuê phòng trọ")
public class PriceSuggestionController {

    private final PriceSuggestionService priceSuggestionService;

    @GetMapping
    @PreAuthorize("hasAnyRole('LANDLORD', 'ADMIN')")
    @Operation(summary = "Lấy gợi ý giá thuê dựa trên khu vực, loại phòng và diện tích")
    public ResponseEntity<ApiResponse<PriceSuggestionResponse>> getPriceSuggestion(
            @RequestParam String city,
            @RequestParam(required = false, defaultValue = "") String district,
            @RequestParam RoomType roomType,
            @RequestParam(required = false) Double area) {

        PriceSuggestionResponse response = priceSuggestionService.getPriceSuggestion(city, district, roomType, area);
        return ResponseEntity.ok(ApiResponse.success("Lấy gợi ý giá thành công", response));
    }
}
