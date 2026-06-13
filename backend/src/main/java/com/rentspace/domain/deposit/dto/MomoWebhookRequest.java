package com.rentspace.domain.deposit.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.HashMap;
import java.util.Map;

/**
 * DTO cho MoMo IPN Webhook callback.
 * Thay thế Map<String, String> để Swagger hiển thị đúng schema.
 */
@Data
@Schema(description = "Payload từ MoMo IPN Callback")
public class MomoWebhookRequest {

    @Schema(description = "Mã đối tác", example = "MOMO")
    private String partnerCode;

    @Schema(description = "Mã đơn hàng — chính là depositId", example = "26")
    private String orderId;

    @Schema(description = "Mã yêu cầu", example = "test-request-id-001")
    private String requestId;

    @Schema(description = "Số tiền giao dịch (VND)", example = "3000000")
    private String amount;

    @Schema(description = "Thông tin đơn hàng", example = "Thanh toan dat coc 26")
    private String orderInfo;

    @Schema(description = "Mã giao dịch MoMo", example = "MOMO_TRANS_12345")
    private String transId;

    @Schema(description = "Phương thức thanh toán", example = "qr")
    private String payType;

    @Schema(description = "Thời gian phản hồi (unix ms)", example = "1718275200000")
    private String responseTime;

    @Schema(description = "Mã kết quả: 0 = thành công", example = "0")
    private String resultCode;

    @Schema(description = "Thông điệp kết quả", example = "Thành công.")
    private String message;

    @Schema(description = "Dữ liệu bổ sung", example = "")
    private String extraData;

    @Schema(description = "Chữ ký HMAC-SHA256. Dùng 'bypass' khi test local.", example = "bypass")
    private String signature;

    /**
     * Chuyển đổi sang Map<String, String> để tương thích với logic xử lý hiện tại.
     */
    public Map<String, String> toParamMap() {
        Map<String, String> params = new HashMap<>();
        if (partnerCode != null) params.put("partnerCode", partnerCode);
        if (orderId != null) params.put("orderId", orderId);
        if (requestId != null) params.put("requestId", requestId);
        if (amount != null) params.put("amount", amount);
        if (orderInfo != null) params.put("orderInfo", orderInfo);
        if (transId != null) params.put("transId", transId);
        if (payType != null) params.put("payType", payType);
        if (responseTime != null) params.put("responseTime", responseTime);
        if (resultCode != null) params.put("resultCode", resultCode);
        if (message != null) params.put("message", message);
        if (extraData != null) params.put("extraData", extraData);
        if (signature != null) params.put("signature", signature);
        return params;
    }
}
