package com.rentspace.infrastructure.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class AesEncryptionUtilTest {

    private AesEncryptionUtil aesEncryptionUtil;

    @BeforeEach
    void setUp() throws Exception {
        aesEncryptionUtil = new AesEncryptionUtil();
        ReflectionTestUtils.setField(aesEncryptionUtil, "secretKeyStr", "my-super-secret-key-32chars-long!");
        ReflectionTestUtils.setField(aesEncryptionUtil, "saltStr", "rentspace-salt-value-16");
        aesEncryptionUtil.init();
    }

    @Test
    void encryptAndDecrypt_HappyPath_ShouldSucceed() {
        String plaintext = "1234567890";
        String ciphertext = aesEncryptionUtil.encrypt(plaintext);
        assertNotNull(ciphertext);
        assertNotEquals(plaintext, ciphertext);

        String decrypted = aesEncryptionUtil.decrypt(ciphertext);
        assertEquals(plaintext, decrypted);
    }

    @Test
    void encryptAndDecrypt_NullValue_ShouldReturnNull() {
        assertNull(aesEncryptionUtil.encrypt(null));
        assertNull(aesEncryptionUtil.decrypt(null));
    }
}
