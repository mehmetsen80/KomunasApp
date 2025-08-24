package org.lite.komunas.service.impl;

import lombok.extern.slf4j.Slf4j;
import org.lite.komunas.entity.WhatsAppMessage;
import org.lite.komunas.model.WhatsAppWebhookPayload;
import org.lite.komunas.repository.WhatsAppContactRepository;
import org.lite.komunas.repository.WhatsAppMessageRepository;
import org.lite.komunas.service.WhatsAppWebhookFieldProcessor;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
public class WhatsAppWebhookFieldMessageEchoesService extends WhatsAppWebhookFieldProcessor {

    private final WhatsAppMessageRepository messageRepository;

    public WhatsAppWebhookFieldMessageEchoesService(WhatsAppContactRepository contactRepository,
                                                  WhatsAppMessageRepository messageRepository) {
        super(contactRepository);
        this.messageRepository = messageRepository;
    }

    @Override
    public void process(WhatsAppWebhookPayload payload) {
        log.info("Processing message echoes webhook");
        
        // Process contacts if available
        processContacts(payload, getFieldType());
        
        AtomicInteger totalEchoes = new AtomicInteger(0);
        AtomicInteger savedEchoes = new AtomicInteger(0);
        AtomicInteger skippedEchoes = new AtomicInteger(0);
        ConcurrentLinkedQueue<String> skippedEchoIds = new ConcurrentLinkedQueue<>();
        
        if (payload.getValue() != null && payload.getValue().getMessageEchoes() != null) {
            totalEchoes.set(payload.getValue().getMessageEchoes().length);
            log.info("Found {} message echoes to process", totalEchoes.get());
            
            for (WhatsAppWebhookPayload.WhatsAppMessageEcho echo : payload.getValue().getMessageEchoes()) {
                if (echo != null && echo.getText() != null) {
                    log.info("Processing message echo from {} to {}: {} (type: {})", 
                            echo.getFrom(), echo.getTo(), echo.getText().getBody(), echo.getMessageCreationType());
                    boolean saved = saveMessageEchoToDatabase(echo, payload, getFieldType());
                    if (saved) {
                        savedEchoes.incrementAndGet();
                    } else {
                        skippedEchoes.incrementAndGet();
                        skippedEchoIds.offer(echo.getId());
                    }
                } else {
                    skippedEchoes.incrementAndGet();
                    String echoId = echo != null ? echo.getId() : "null";
                    skippedEchoIds.offer(echoId);
                    log.warn("Skipping message echo with ID: {} - echo or text is null", echoId);
                }
            }
        }
        
        log.info("=== MESSAGE ECHOES WEBHOOK SUMMARY ===");
        log.info("Total echoes found: {}", totalEchoes.get());
        log.info("Echoes saved: {}", savedEchoes.get());
        log.info("Echoes skipped: {}", skippedEchoes.get());
        if (!skippedEchoIds.isEmpty()) {
            log.info("Skipped echo IDs: {}", skippedEchoIds);
        }
        log.info("=======================================");
    }

    @Override
    public String getFieldType() {
        return "message_echoes";
    }

    private boolean saveMessageEchoToDatabase(WhatsAppWebhookPayload.WhatsAppMessageEcho echo, 
                                            WhatsAppWebhookPayload payload, String webhookField) {
        try {
            // Check if message already exists
            if (messageRepository.existsByWhatsappId(echo.getId())) {
                log.info("Message echo already exists in database: {}", echo.getId());
                return false; // Indicate skipped
            }

            WhatsAppMessage dbMessage = WhatsAppMessage.builder()
                    .whatsappId(echo.getId())
                    .fromNumber(echo.getFrom())
                    .toNumber(echo.getTo())
                    .messageType(echo.getType())
                    .messageBody(echo.getText() != null ? echo.getText().getBody() : "")
                    .timestamp(echo.getTimestamp())
                    .phoneNumberId(payload.getValue().getMetadata() != null ? 
                            payload.getValue().getMetadata().getPhoneNumberId() : null)
                    .displayPhoneNumber(payload.getValue().getMetadata() != null ? 
                            payload.getValue().getMetadata().getDisplayPhoneNumber() : null)
                    .webhookField(webhookField)
                    .isFromMe(true) // Echoes are outgoing messages
                    .status("sent") // Echoes are typically sent messages
                    .build();

            WhatsAppMessage savedMessage = messageRepository.save(dbMessage);
            log.info("Message echo saved to database with ID: {}", savedMessage.getId());
            return true; // Indicate saved
            
        } catch (Exception e) {
            log.error("Error saving message echo to database: {}", echo.getId(), e);
            return false; // Indicate skipped
        }
    }
} 