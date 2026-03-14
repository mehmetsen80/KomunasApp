package org.lite.komunas.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lite.komunas.dto.ResourceUpdateNotification;
import org.lite.komunas.service.USCISScraperService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/webhook")
@Slf4j
@RequiredArgsConstructor
public class WebhookController {

    private final USCISScraperService uscisScraperService;

    @PostMapping
    public void handleWebhook(@RequestBody ResourceUpdateNotification notification) {
        log.info("System Webhook: Received signal - Type: {}", notification.getType());

        if ("DOCUMENT_HARD_DELETED".equals(notification.getType())) {
            String documentId = (String) notification.getDelta().get("documentId");
            log.info("🔔 Processing HARD_DELETE signal for document: {}", documentId);
            uscisScraperService.handleDocumentDeletion(documentId);
        }
    }
}
