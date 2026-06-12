package com.rentspace.infrastructure.payment;

import com.rentspace.domain.deposit.DepositService;
import com.rentspace.domain.listing.PromotedListingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Router chuyển hướng xử lý IPN/Webhook từ VNPay tới Service phù hợp (đặt cọc hoặc quảng cáo).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class VnpayWebhookRouter {

    private final DepositService depositService;
    private final PromotedListingService promotedListingService;

    public Map<String, String> routeWebhook(Map<String, String> params) {
        String txnRef = params.get("vnp_TxnRef");
        log.info("Routing VNPay Webhook for txnRef: {}", txnRef);
        
        if (txnRef != null && txnRef.startsWith("PROMOTE_")) {
            return promotedListingService.processPromotedWebhook(params);
        } else {
            return depositService.processVnpayWebhook(params);
        }
    }
}
