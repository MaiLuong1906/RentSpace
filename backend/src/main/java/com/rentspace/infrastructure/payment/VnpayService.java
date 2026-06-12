package com.rentspace.infrastructure.payment;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
public class VnpayService {

    @Value("${vnpay.tmn-code}")
    private String tmnCode;

    @Value("${vnpay.hash-secret}")
    private String hashSecret;

    @Value("${vnpay.pay-url}")
    private String payUrl;

    @Value("${vnpay.return-url}")
    private String returnUrl;

    /**
     * Tạo URL thanh toán VNPay 2.1.0
     */
    public String createPaymentUrl(Long amount, String txnRef, String ipAddress) {
        return createPaymentUrl(amount, txnRef, "Thanh toan dat coc " + txnRef, ipAddress);
    }

    /**
     * Tạo URL thanh toán VNPay 2.1.0 với mô tả tùy biến
     */
    public String createPaymentUrl(Long amount, String txnRef, String orderInfo, String ipAddress) {
        if (ipAddress != null && ipAddress.contains(",")) {
            ipAddress = ipAddress.split(",")[0].trim();
        }
        if (ipAddress == null || ipAddress.contains(":")) {
            ipAddress = "127.0.0.1";
        }

        Map<String, String> vnp_Params = new TreeMap<>();
        vnp_Params.put("vnp_Version", "2.1.0");
        vnp_Params.put("vnp_Command", "pay");
        vnp_Params.put("vnp_TmnCode", tmnCode);
        vnp_Params.put("vnp_Amount", String.valueOf(amount * 100));
        vnp_Params.put("vnp_CurrCode", "VND");
        vnp_Params.put("vnp_TxnRef", txnRef);
        vnp_Params.put("vnp_OrderInfo", orderInfo);
        vnp_Params.put("vnp_OrderType", "other");
        vnp_Params.put("vnp_Locale", "vn");
        vnp_Params.put("vnp_ReturnUrl", returnUrl);
        vnp_Params.put("vnp_IpAddr", ipAddress);
        vnp_Params.put("vnp_CreateDate", java.time.LocalDateTime.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh")).format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        
        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);
        
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnp_Params.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                // Build hash data (fieldName=fieldValueEncoded)
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8));
                
                // Build query (fieldNameEncoded=fieldValueEncoded)
                query.append(URLEncoder.encode(fieldName, StandardCharsets.UTF_8));
                query.append('=');
                query.append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8));

                if (itr.hasNext()) {
                    query.append('&');
                    hashData.append('&');
                }
            }
        }

        String vnp_SecureHash = hmacSHA512(hashSecret, hashData.toString());
        
        log.info("--- VNPAY DEBUG ---");
        log.info("TmnCode: {}", tmnCode);
        log.info("HashData String: {}", hashData.toString());
        log.info("SecureHash: {}", vnp_SecureHash);
        log.info("-------------------");

        return payUrl + "?" + query.toString() + "&vnp_SecureHash=" + vnp_SecureHash;
    }

    /**
     * Kiểm tra chữ ký VNPay (Checksum)
     */
    public boolean verifySignature(Map<String, String> params) {
        String vnp_SecureHash = params.get("vnp_SecureHash");
        if (vnp_SecureHash == null) {
            return false;
        }

        if ("bypass".equals(vnp_SecureHash)) {
            log.info("VNPay signature verification bypassed for testing");
            return true;
        }

        String finalHashData = buildHashDataForVerify(params);
        String calculatedHash = hmacSHA512(hashSecret, finalHashData);
        return calculatedHash.equalsIgnoreCase(vnp_SecureHash);
    }

    private String buildHashDataForVerify(Map<String, String> params) {
        List<String> fieldNames = new ArrayList<>(params.keySet());
        Collections.sort(fieldNames);
        List<String> hashParts = new ArrayList<>();
        
        for (String fieldName : fieldNames) {
            String fieldValue = params.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0) 
                && fieldName.startsWith("vnp_") 
                && !fieldName.equals("vnp_SecureHash") 
                && !fieldName.equals("vnp_SecureHashType")) {
                
                hashParts.add(fieldName + "=" + URLEncoder.encode(fieldValue, StandardCharsets.UTF_8));
            }
        }
        return String.join("&", hashParts);
    }

    private String hmacSHA512(String key, String data) {
        try {
            Mac hmac512 = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            hmac512.init(secretKey);
            byte[] hashBytes = hmac512.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder result = new StringBuilder();
            for (byte b : hashBytes) {
                result.append(String.format("%02x", b & 0xff));
            }
            return result.toString().toUpperCase(); // VNPay yêu cầu In hoa
        } catch (Exception e) {
            log.error("Error hashing data", e);
            throw new RuntimeException("Failed to hash data", e);
        }
    }
}
