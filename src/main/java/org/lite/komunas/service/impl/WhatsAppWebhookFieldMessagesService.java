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
public class WhatsAppWebhookFieldMessagesService extends WhatsAppWebhookFieldProcessor {

    private final WhatsAppMessageRepository messageRepository;

    public WhatsAppWebhookFieldMessagesService(WhatsAppContactRepository contactRepository,
                                             WhatsAppMessageRepository messageRepository) {
        super(contactRepository);
        this.messageRepository = messageRepository;
    }

    @Override
    public void process(WhatsAppWebhookPayload payload) {
        log.info("Processing messages webhook");
        
        // Process contacts first
        processContacts(payload, getFieldType());
        
        AtomicInteger totalMessages = new AtomicInteger(0);
        AtomicInteger savedMessages = new AtomicInteger(0);
        AtomicInteger skippedMessages = new AtomicInteger(0);
        ConcurrentLinkedQueue<String> skippedMessageIds = new ConcurrentLinkedQueue<>();
        
        if (payload.getValue() != null && payload.getValue().getMessages() != null) {
            totalMessages.set(payload.getValue().getMessages().length);
            log.info("Found {} messages to process", totalMessages.get());
            
            for (WhatsAppWebhookPayload.WhatsAppMessage message : payload.getValue().getMessages()) {
                if (message != null && message.getText() != null) {
                    log.info("Processing message from {}: {}", message.getFrom(), message.getText().getBody());
                    boolean saved = saveMessageToDatabase(message, payload, getFieldType());
                    if (saved) {
                        savedMessages.incrementAndGet();
                    } else {
                        skippedMessages.incrementAndGet();
                        skippedMessageIds.offer(message.getId());
                    }
                } else {
                    skippedMessages.incrementAndGet();
                    String messageId = message != null ? message.getId() : "null";
                    skippedMessageIds.offer(messageId);
                    log.warn("Skipping message with ID: {} - message or text is null", messageId);
                }
            }
        }
        
        log.info("=== MESSAGES WEBHOOK SUMMARY ===");
        log.info("Total messages found: {}", totalMessages.get());
        log.info("Messages saved: {}", savedMessages.get());
        log.info("Messages skipped: {}", skippedMessages.get());
        if (!skippedMessageIds.isEmpty()) {
            log.info("Skipped message IDs: {}", skippedMessageIds);
        }
        log.info("================================");
    }

    @Override
    public String getFieldType() {
        return "messages";
    }

    private boolean saveMessageToDatabase(WhatsAppWebhookPayload.WhatsAppMessage message, 
                                        WhatsAppWebhookPayload payload, String webhookField) {
        try {
            // Check if message already exists
            if (messageRepository.existsByWhatsappId(message.getId())) {
                log.info("Message already exists in database: {}", message.getId());
                return false; // Indicate skipped
            }

            WhatsAppMessage dbMessage = WhatsAppMessage.builder()
                    .whatsappId(message.getId())
                    .fromNumber(message.getFrom())
                    .messageType(message.getType())
                    .timestamp(message.getTimestamp())
                    .phoneNumberId(payload.getValue().getMetadata() != null ? 
                            payload.getValue().getMetadata().getPhoneNumberId() : null)
                    .displayPhoneNumber(payload.getValue().getMetadata() != null ? 
                            payload.getValue().getMetadata().getDisplayPhoneNumber() : null)
                    .webhookField(webhookField)
                    .isFromMe(false) // Messages from webhook are incoming
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
            } else {
                // For other message types, set empty body
                dbMessage.setMessageBody("");
            }

            // Set contact name and waId if available
            if (payload.getValue().getContacts() != null) {
                for (WhatsAppWebhookPayload.WhatsAppContact contact : payload.getValue().getContacts()) {
                    if (contact.getWaId().equals(message.getFrom()) && contact.getProfile() != null) {
                        dbMessage.setContactName(contact.getProfile().getName());
                        dbMessage.setWaId(contact.getWaId());
                        break;
                    }
                }
            }

            WhatsAppMessage savedMessage = messageRepository.save(dbMessage);
            log.info("Message saved to database with ID: {}", savedMessage.getId());
            return true; // Indicate saved
            
        } catch (Exception e) {
            log.error("Error saving message to database: {}", message.getId(), e);
            return false; // Indicate skipped
        }
    }
} 