package org.lite.komunas.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lite.komunas.model.WhatsAppWebhookPayload;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class WhatsAppWebhookService {

    // Webhook field constants
    public static final String FIELD_MESSAGES = "messages";
    public static final String FIELD_MESSAGE_ECHOES = "message_echoes";
    public static final String FIELD_HISTORY = "history";

    /**
     * Process incoming webhook payload based on the field type
     */
    public void processWebhookPayload(WhatsAppWebhookPayload payload) {
        if (payload == null || payload.getField() == null) {
            log.warn("Invalid webhook payload received");
            return;
        }

        switch (payload.getField()) {
            case FIELD_MESSAGES:
                processMessages(payload);
                break;
            case FIELD_MESSAGE_ECHOES:
                processMessageEchoes(payload);
                break;
            case FIELD_HISTORY:
                processHistory(payload);
                break;
            default:
                log.info("Unhandled webhook field type: {}", payload.getField());
        }
    }

    private void processMessages(WhatsAppWebhookPayload payload) {
        log.info("Processing messages webhook");
        
        if (payload.getValue() != null && payload.getValue().getMessages() != null) {
            for (WhatsAppWebhookPayload.WhatsAppMessage message : payload.getValue().getMessages()) {
                if (message != null && message.getText() != null) {
                    log.info("Message from {}: {}", message.getFrom(), message.getText().getBody());
                    // TODO: Add your business logic here (e.g., save to database, respond, etc.)
                }
            }
        }

        // Process contacts if available
        if (payload.getValue() != null && payload.getValue().getContacts() != null) {
            for (WhatsAppWebhookPayload.WhatsAppContact contact : payload.getValue().getContacts()) {
                if (contact != null && contact.getProfile() != null) {
                    log.info("Contact: {} ({})", contact.getProfile().getName(), contact.getWaId());
                }
            }
        }
    }

    private void processMessageEchoes(WhatsAppWebhookPayload payload) {
        log.info("Processing message echoes webhook");
        
        if (payload.getValue() != null && payload.getValue().getMessageEchoes() != null) {
            for (WhatsAppWebhookPayload.WhatsAppMessageEcho echo : payload.getValue().getMessageEchoes()) {
                if (echo != null && echo.getText() != null) {
                    log.info("Message echo from {} to {}: {} (type: {})", 
                            echo.getFrom(), echo.getTo(), echo.getText().getBody(), echo.getMessageCreationType());
                    // TODO: Add your business logic here
                }
            }
        }
    }

    private void processHistory(WhatsAppWebhookPayload payload) {
        log.info("Processing history webhook");
        
        if (payload.getValue() != null && payload.getValue().getHistory() != null) {
            for (WhatsAppWebhookPayload.WhatsAppHistory history : payload.getValue().getHistory()) {
                if (history != null && history.getThreads() != null) {
                    for (WhatsAppWebhookPayload.WhatsAppThread thread : history.getThreads()) {
                        if (thread != null && thread.getMessages() != null) {
                            log.info("History thread {}: {} messages", thread.getId(), thread.getMessages().length);
                            // TODO: Add your business logic here
                        }
                    }
                }
            }
        }
    }
} 