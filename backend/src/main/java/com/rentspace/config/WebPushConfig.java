package com.rentspace.config;

import nl.martijndwars.webpush.PushService;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.security.GeneralSecurityException;
import java.security.Security;

@Configuration
public class WebPushConfig {

    @Value("${app.webpush.public-key}")
    private String publicKey;

    @Value("${app.webpush.private-key}")
    private String privateKey;

    @Value("${app.webpush.subject}")
    private String subject;

    @Bean
    PushService pushService() throws GeneralSecurityException {
        // web-push dùng KeyFactory.getInstance("EC", "BC") — phải register trước khi khởi tạo
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
        return new PushService(publicKey, privateKey, subject);
    }
}
