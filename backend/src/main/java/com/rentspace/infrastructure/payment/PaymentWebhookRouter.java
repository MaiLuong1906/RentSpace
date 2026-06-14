package com.rentspace.infrastructure.payment;

import com.rentspace.domain.deposit.DepositService;
import com.rentspace.domain.listing.PromotedListingService;
import com.rentspace.domain.subscription.SubscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Router chuyển hướng xử lý IPN/Webhook từ các cổng thanh toán (VNPay, MoMo) tới Service phù hợp.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentWebhookRouter {

    private final DepositService depositService;
    private final PromotedListingService promotedListingService;
    private final SubscriptionService subscriptionService;

    /**
     * Định tuyến Webhook VNPay (GET).
     */
    public Map<String, String> routeVnpayWebhook(Map<String, String> params) {
        String txnRef = params.get("vnp_TxnRef");
        log.info("Routing VNPay Webhook for txnRef: {}", txnRef);

        if (txnRef != null && txnRef.startsWith("PROMOTE_")) {
            return promotedListingService.processPromotedWebhook(params);
        } else if (txnRef != null && txnRef.startsWith("SUB_")) {
            return subscriptionService.processVnpayWebhook(params);
        } else {
            return depositService.processVnpayWebhook(params);
        }
    }

    /**
     * Định tuyến Webhook MoMo (POST).
     */
    public Map<String, Object> routeMomoWebhook(Map<String, String> params) {
        String orderId = params.get("orderId");
        log.info("Routing MoMo Webhook for orderId: {}", orderId);

        if (orderId != null && orderId.startsWith("PROMOTE_")) {
            return promotedListingService.processPromotedMomoWebhook(params);
        } else if (orderId != null && orderId.startsWith("SUB_")) {
            return subscriptionService.processMomoWebhook(params);
        } else {
            return depositService.processMomoWebhook(params);
        }
    }
}

