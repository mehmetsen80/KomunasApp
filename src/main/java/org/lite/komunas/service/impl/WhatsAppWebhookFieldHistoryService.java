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
public class WhatsAppWebhookFieldHistoryService extends WhatsAppWebhookFieldProcessor {

    private final WhatsAppMessageRepository messageRepository;

    public WhatsAppWebhookFieldHistoryService(WhatsAppContactRepository contactRepository,
                                            WhatsAppMessageRepository messageRepository) {
        super(contactRepository);
        this.messageRepository = messageRepository;
    }

    @Override
    public void process(WhatsAppWebhookPayload payload) {
        log.info("Processing history webhook");
        
        // Process contacts if available
        processContacts(payload, getFieldType());
        
        AtomicInteger totalHistoryMessages = new AtomicInteger(0);
        AtomicInteger savedHistoryMessages = new AtomicInteger(0);
        AtomicInteger skippedHistoryMessages = new AtomicInteger(0);
        ConcurrentLinkedQueue<String> skippedHistoryIds = new ConcurrentLinkedQueue<>();
        
        if (payload.getValue() != null && payload.getValue().getHistory() != null) {
            for (WhatsAppWebhookPayload.WhatsAppHistory history : payload.getValue().getHistory()) {
                if (history != null && history.getThreads() != null) {
                    for (WhatsAppWebhookPayload.WhatsAppThread thread : history.getThreads()) {
                        if (thread != null && thread.getMessages() != null) {
                            log.info("Processing history thread {}: {} messages", thread.getId(), thread.getMessages().length);
                            for (WhatsAppWebhookPayload.WhatsAppMessage message : thread.getMessages()) {
                                if (message != null) {
                                    totalHistoryMessages.incrementAndGet();
                                    boolean saved = saveHistoryMessageToDatabase(message, payload, getFieldType(), thread.getId());
                                    if (saved) {
                                        savedHistoryMessages.incrementAndGet();
                                    } else {
                                        skippedHistoryMessages.incrementAndGet();
                                        skippedHistoryIds.offer(message.getId());
                                    }
                                } else {
                                    skippedHistoryMessages.incrementAndGet();
                                    skippedHistoryIds.offer("null");
                                    log.warn("Skipping null message in history thread: {}", thread.getId());
                                }
                            }
                        }
                    }
                }
            }
        }
        
        log.info("=== HISTORY WEBHOOK SUMMARY ===");
        log.info("Total history messages found: {}", totalHistoryMessages.get());
        log.info("History messages saved: {}", savedHistoryMessages.get());
        log.info("History messages skipped: {}", skippedHistoryMessages.get());
        if (!skippedHistoryIds.isEmpty()) {
            log.info("Skipped history message IDs: {}", skippedHistoryIds);
        }
        log.info("=================================");
    }

    @Override
    public String getFieldType() {
        return "history";
    }

    private boolean saveHistoryMessageToDatabase(WhatsAppWebhookPayload.WhatsAppMessage message, 
                                               WhatsAppWebhookPayload payload, String webhookField, String threadId) {
        try {
            // Check if message already exists
            if (messageRepository.existsByWhatsappId(message.getId())) {
                log.info("History message already exists in database: {}", message.getId());
                return false; // Indicate skipped
            }

            WhatsAppMessage dbMessage = WhatsAppMessage.builder()
                    .whatsappId(message.getId())
                    .fromNumber(message.getFrom())
                    .messageType(message.getType())
                    .phoneNumberId(payload.getValue().getMetadata() != null ? 
                            payload.getValue().getMetadata().getPhoneNumberId() : null)
                    .displayPhoneNumber(payload.getValue().getMetadata() != null ? 
                            payload.getValue().getMetadata().getDisplayPhoneNumber() : null)
                    .webhookField(webhookField)
                    .conversationId(threadId)
                    .timestamp(message.getTimestamp())
                    .isFromMe(message.getHistoryContext() != null ? 
                            message.getHistoryContext().isFromMe() : false)
                    .status(message.getHistoryContext() != null ? 
                            message.getHistoryContext().getStatus() : null)
                    .build();

            // Handle different message types
            if ("text".equals(message.getType()) && message.getText() != null) {
                dbMessage.setMessageBody(message.getText().getBody());
            } else if (message.getType() != null && message.getType().contains("media")) {
                // For media messages, set appropriate fields
                dbMessage.setMessageBody(""); // No text body for media
                // Note: Media URL, ID, and caption would need to be extracted from the actual media payload
                // This is a placeholder for future enhancement
            } else {
                // For other message types (like media_placeholder), set empty body
                dbMessage.setMessageBody("");
            }

            WhatsAppMessage savedMessage = messageRepository.save(dbMessage);
            log.info("History message saved to database with ID: {} (Type: {})", savedMessage.getId(), message.getType());
            return true; // Indicate saved
            
        } catch (Exception e) {
            log.error("Error saving history message to database: {}", message.getId(), e);
            return false; // Indicate skipped
        }
    }
} 