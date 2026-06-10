package com.rentspace.infrastructure.payment;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;

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
     * Tạo URL thanh toán VNPay
     */
    public String createPaymentUrl(Long amount, String txnRef, String ipAddress) {
        // TODO [RS-123]: Implement VNPay URL generation logic
        log.info("Generating VNPay URL for txnRef: {}, amount: {}", txnRef, amount);
        return payUrl + "?vnp_Amount=" + amount + "&vnp_TxnRef=" + txnRef;
    }

    /**
     * Kiểm tra chữ ký VNPay (Checksum)
     */
    public boolean verifySignature(Map<String, String> params) {
        // TODO [RS-124]: Implement VNPay signature verification logic
        log.info("Verifying VNPay signature for params: {}", params);
        throw new UnsupportedOperationException("Chưa implement VNPay signature verification"); 
    }
}
