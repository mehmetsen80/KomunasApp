package org.lite.komunas.validator;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.Objects;

@Slf4j
@Component
public class WhatsAppSignatureValidator {

    /**
     * Validates the X-Hub-Signature-256 header for WhatsApp webhook requests
     * 
     * @param payload The raw request payload
     * @param signature The signature from X-Hub-Signature-256 header
     * @param appSecret The WhatsApp app secret
     * @return true if signature is valid, false otherwise
     */
    public boolean validateSignature(String payload, String signature, String appSecret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(appSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String expectedSignature = "sha256=" + bytesToHex(hash);
            return Objects.equals(expectedSignature, signature);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            log.error("Signature validation failed", e);
            return false;
        }
    }

    /**
     * Converts byte array to hexadecimal string
     * 
     * @param bytes The byte array to convert
     * @return Hexadecimal string representation
     */
    private String bytesToHex(byte[] bytes) {
        StringBuilder result = new StringBuilder();
        for (byte b : bytes) {
            result.append(String.format("%02x", b));
        }
        return result.toString();
    }
} 