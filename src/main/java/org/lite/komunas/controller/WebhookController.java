package org.lite.komunas.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Webhooks", description = "System-level webhooks for external signal processing")
public class WebhookController {

    private final USCISScraperService uscisScraperService;

    @PostMapping
    @Operation(summary = "Handle system signals", description = "Processes incoming webhook signals from external systems (e.g., Knowledge Hub document deletions).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Signal successfully processed"),
            @ApiResponse(responseCode = "400", description = "Invalid notification payload", content = @Content(schema = @Schema(implementation = ResourceUpdateNotification.class)))
    })
    public void handleWebhook(@RequestBody ResourceUpdateNotification notification) {
        log.info("System Webhook: Received signal - Type: {}", notification.getType());

        if ("DOCUMENT_HARD_DELETED".equals(notification.getType())) {
            String documentId = (String) notification.getDelta().get("documentId");
            log.info("🔔 Processing HARD_DELETE signal for document: {}", documentId);
            uscisScraperService.handleDocumentDeletion(documentId);
        }
    }
}
