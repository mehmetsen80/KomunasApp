package org.lite.komunas.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import org.apache.hc.core5.http.HttpStatus;
import org.lite.komunas.model.WhatsAppWebhookPayload;
import org.lite.komunas.service.WhatsAppWebhookService;
import org.lite.komunas.validator.WhatsAppSignatureValidator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@Slf4j
@RequestMapping("/whatsapp/webhook")
@RequiredArgsConstructor
@Tag(name = "WhatsApp Communication", description = "APIs for managing WhatsApp Webhook")
public class WhatsAppController {

    @Value("${whatsapp.verify.token}")
    private String verifyToken;

    @Value("${whatsapp.app.id}")
    private String appId;

    @Value("${whatsapp.app.secret}")
    private String appSecret;

    @Value("${whatsapp.app.name}")
    private String appName;

    @Value("${whatsapp.app.businessid}")
    private String businessid;

    private final ObjectMapper objectMapper;
    private final WhatsAppSignatureValidator signatureValidator;
    private final WhatsAppWebhookService webhookService;

    // Webhook verification endpoint (GET)
    @GetMapping
    public ResponseEntity<?> verifyWebhook(
            @RequestParam(value = "hub.mode", required = false) String mode,
            @RequestParam(value = "hub.verify_token", required = false) String token,
            @RequestParam(value = "hub.challenge", required = false) String challenge) {

        log.info("Webhook verification request - Mode: {}, Token: {}, Challenge: {}", mode, token, challenge);

        // Check if mode and token were sent
        if (mode != null && token != null && challenge != null) {
            // Check if mode and token are correct
            if ("subscribe".equals(mode) && verifyToken.equals(token)) {
                log.info("WEBHOOK VERIFIED");
                // Respond with 200 OK and challenge token from the request
                return ResponseEntity.ok(challenge);
            } else {
                log.warn("Webhook verification failed - Invalid mode or token");
                // Respond with 403 Forbidden if verify tokens don't match
                return ResponseEntity.status(403).build();
            }
        }

        log.warn("Webhook verification failed - Missing required parameters");
        return ResponseEntity.badRequest()
                .body("Missing required parameters: hub.mode, hub.verify_token, hub.challenge");
    }

    // Webhook event handler (POST)
    @PostMapping
    public ResponseEntity<String> handleWebhookEvent(
            @RequestBody String rawPayload,
            @RequestHeader(value = "X-Hub-Signature-256", required = false) String signature) {

        log.info("Received webhook payload: {}", rawPayload);

        // Validate signature
        if (signature != null && !signatureValidator.validateSignature(rawPayload, signature, appSecret)) {
            log.warn("Invalid signature for payload: {}", rawPayload);
            return ResponseEntity.status(HttpStatus.SC_UNAUTHORIZED).body("Invalid signature");
        }

        try {
            // Parse raw payload into WhatsAppWebhookPayload
            WhatsAppWebhookPayload payload = objectMapper.readValue(rawPayload, WhatsAppWebhookPayload.class);

            // Process the webhook payload based on its field type
            webhookService.processWebhookPayload(payload);

            return ResponseEntity.ok("Webhook processed successfully - Field: " + payload.getField());

        } catch (Exception e) {
            log.error("Error processing webhook payload", e);
            return ResponseEntity.status(HttpStatus.SC_BAD_REQUEST)
                    .body("Error processing payload: " + e.getMessage());
        }
    }
}
