package org.lite.komunas.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.beans.factory.annotation.Value;


@Slf4j
@RequestMapping("/whatsapp")
@RequiredArgsConstructor
@Tag(name = "People", description = "APIs for managing WhatsApp Webhook")
public class WhatsAppController {

    @Value("${whatsapp.verify.token}")
    private String verifyToken;

    @GetMapping(value = "/verify_webhook", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> webHook(
            @RequestParam("hub.mode") String mode,
            @RequestParam("hub.verify_token") String token,
            @RequestParam("hub.challenge") String challenge) {
        
        log.info("Webhook verification request - Mode: {}, Token: {}, Challenge: {}", mode, token, challenge);
        
        // Check if mode and token were sent
        if (mode != null && token != null) {
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
        
        log.warn("Webhook verification failed - Missing mode or token");
        return ResponseEntity.badRequest().body("Missing required parameters");
    }
}
