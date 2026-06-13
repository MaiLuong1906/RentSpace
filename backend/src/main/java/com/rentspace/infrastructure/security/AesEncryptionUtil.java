package com.rentspace.infrastructure.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.security.spec.KeySpec;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.util.Base64;

@Component
public class AesEncryptionUtil {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int TAG_LENGTH_BIT = 128;
    private static final int IV_LENGTH_BYTE = 12;

    @Value("${app.security.encryption.secret-key:my-super-secret-key-32chars-long!}")
    private String secretKeyStr;

    @Value("${app.security.encryption.salt:rentspace-salt-value-16}")
    private String saltStr;

    private SecretKey secretKey;

    @PostConstruct
    public void init() throws Exception {
        // Derive key using PBKDF2 with salt to ensure it is always 256 bits
        SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
        KeySpec spec = new PBEKeySpec(secretKeyStr.toCharArray(), saltStr.getBytes(StandardCharsets.UTF_8), 65536, 256);
        SecretKey tmp = factory.generateSecret(spec);
        this.secretKey = new SecretKeySpec(tmp.getEncoded(), "AES");
    }

    public String encrypt(String plaintext) {
        if (plaintext == null) {
            return null;
        }
        try {
            byte[] iv = new byte[IV_LENGTH_BYTE];
            SecureRandom random = new SecureRandom();
            random.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(TAG_LENGTH_BIT, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, parameterSpec);

            byte[] cipherText = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            // Concatenate IV and Ciphertext
            byte[] encryptedBuffer = new byte[iv.length + cipherText.length];
            System.arraycopy(iv, 0, encryptedBuffer, 0, iv.length);
            System.arraycopy(cipherText, 0, encryptedBuffer, iv.length, cipherText.length);

            return Base64.getEncoder().encodeToString(encryptedBuffer);
        } catch (Exception e) {
            throw new RuntimeException("Encryption failed: " + e.getMessage(), e);
        }
    }

    public String decrypt(String ciphertext) {
        if (ciphertext == null) {
            return null;
        }
        try {
            byte[] encryptedBuffer = Base64.getDecoder().decode(ciphertext);

            byte[] iv = new byte[IV_LENGTH_BYTE];
            System.arraycopy(encryptedBuffer, 0, iv, 0, iv.length);

            int cipherTextLength = encryptedBuffer.length - IV_LENGTH_BYTE;
            byte[] cipherText = new byte[cipherTextLength];
            System.arraycopy(encryptedBuffer, IV_LENGTH_BYTE, cipherText, 0, cipherTextLength);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(TAG_LENGTH_BIT, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, parameterSpec);

            byte[] decryptedBytes = cipher.doFinal(cipherText);
            return new String(decryptedBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Decryption failed: " + e.getMessage(), e);
        }
    }
}
