package com.rentspace.domain.notification.email;

import com.rentspace.domain.notification.email.dto.DepositEmailDto;
import com.rentspace.domain.notification.email.dto.DisputeEmailDto;
import com.rentspace.domain.notification.email.dto.SubscriptionEmailDto;

public interface EmailService {

    void sendDepositRequestedEmail(String toEmail, DepositEmailDto data);

    void sendDepositMatchedEmail(String toEmail, DepositEmailDto data);

    void sendDisputeAlertEmail(String toEmail, DisputeEmailDto data);

    void sendSubscriptionExpiryWarningEmail(String toEmail, SubscriptionEmailDto data);
}
