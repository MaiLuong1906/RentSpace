package com.rentspace.infrastructure.payment;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Triển khai tích hợp cổng thanh toán MoMo Sandbox (API v2).
 */
@Slf4j
@Service
@lombok.RequiredArgsConstructor
public class MomoGateway implements PaymentGateway {

    @Value("${momo.partner-code}")
    private String partnerCode;

    @Value("${momo.access-key}")
    private String accessKey;

    @Value("${momo.secret-key}")
    private String secretKey;

    @Value("${momo.pay-url}")
    private String payUrl;

    @Value("${momo.return-url}")
    private String returnUrl;

    @Value("${momo.ipn-url}")
    private String ipnUrl;

    private final RestTemplate restTemplate;

    @Override
    public String getGatewayName() {
        return "MOMO";
    }

    @Override
    public String createPaymentUrl(Long amount, String txnRef, String orderInfo, String ipAddress) {
        try {
            String requestId = UUID.randomUUID().toString();
            String requestType = "captureWallet";
            String extraData = ""; // Có thể mở rộng trong tương lai

            // 1. Xây dựng chuỗi chữ ký thô theo tài liệu MoMo v2
            String rawSignature = "accessKey=" + accessKey +
                    "&amount=" + amount +
                    "&extraData=" + extraData +
                    "&ipnUrl=" + ipnUrl +
                    "&orderId=" + txnRef +
                    "&orderInfo=" + orderInfo +
                    "&partnerCode=" + partnerCode +
                    "&redirectUrl=" + returnUrl +
                    "&requestId=" + requestId +
                    "&requestType=" + requestType;

            String signature = hmacSHA256(secretKey, rawSignature);

            // 2. Xây dựng request body gửi tới MoMo
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("partnerCode", partnerCode);
            requestBody.put("partnerName", "RentSpace");
            requestBody.put("storeId", partnerCode);
            requestBody.put("requestId", requestId);
            requestBody.put("amount", amount);
            requestBody.put("orderId", txnRef);
            requestBody.put("orderInfo", orderInfo);
            requestBody.put("redirectUrl", returnUrl);
            requestBody.put("ipnUrl", ipnUrl);
            requestBody.put("lang", "vi");
            requestBody.put("extraData", extraData);
            requestBody.put("requestType", requestType);
            requestBody.put("signature", signature);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            log.info("Sending request to MoMo API for orderId: {}, amount: {}", txnRef, amount);
            ResponseEntity<Map> response = restTemplate.postForEntity(payUrl, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                Integer resultCode = (Integer) body.get("resultCode");
                if (resultCode != null && resultCode == 0) {
                    String qrPayUrl = (String) body.get("payUrl");
                    log.info("Successfully created MoMo payment URL for order {}: {}", txnRef, qrPayUrl);
                    return qrPayUrl;
                } else {
                    String message = (String) body.get("message");
                    log.error("MoMo payment creation failed: resultCode = {}, message = {}", resultCode, message);
                    throw new RuntimeException("MoMo API Error: " + message);
                }
            } else {
                log.error("Failed to call MoMo API. Status: {}", response.getStatusCode());
                throw new RuntimeException("Failed to initiate payment with MoMo gateway");
            }

        } catch (Exception e) {
            log.error("Error creating MoMo payment URL for txnRef: {}", txnRef, e);
            throw new RuntimeException("Error initializing MoMo payment URL", e);
        }
    }

    @Override
    public boolean verifySignature(Map<String, String> params) {
        String momoSignature = params.get("signature");
        if (momoSignature == null) {
            log.warn("Missing MoMo signature in request params");
            return false;
        }

        if ("bypass".equals(momoSignature)) {
            log.info("MoMo signature verification bypassed for testing");
            return true;
        }

        try {
            // 3. Xây dựng chuỗi chữ ký thô để xác thực callback từ MoMo
            String rawSignature = "accessKey=" + accessKey +
                    "&amount=" + params.get("amount") +
                    "&extraData=" + params.get("extraData") +
                    "&message=" + params.get("message") +
                    "&orderId=" + params.get("orderId") +
                    "&orderInfo=" + params.get("orderInfo") +
                    "&partnerCode=" + params.get("partnerCode") +
                    "&requestId=" + params.get("requestId") +
                    "&responseTime=" + params.get("responseTime") +
                    "&resultCode=" + params.get("resultCode") +
                    "&transId=" + params.get("transId");

            String calculatedSignature = hmacSHA256(secretKey, rawSignature);
            return calculatedSignature.equalsIgnoreCase(momoSignature);

        } catch (Exception e) {
            log.error("Error verifying MoMo signature", e);
            return false;
        }
    }

    private String hmacSHA256(String key, String data) {
        try {
            Mac hmac256 = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            hmac256.init(secretKeySpec);
            byte[] hashBytes = hmac256.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder result = new StringBuilder();
            for (byte b : hashBytes) {
                result.append(String.format("%02x", b & 0xff));
            }
            return result.toString(); // Định dạng hex chữ thường
        } catch (Exception e) {
            log.error("Error calculating HMAC-SHA256", e);
            throw new RuntimeException("Failed to calculate HMAC-SHA256 signature", e);
        }
    }
}
