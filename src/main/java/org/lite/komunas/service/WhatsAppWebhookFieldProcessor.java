package org.lite.komunas.service;

import lombok.extern.slf4j.Slf4j;
import org.lite.komunas.entity.WhatsAppContact;
import org.lite.komunas.model.WhatsAppWebhookPayload;
import org.lite.komunas.repository.WhatsAppContactRepository;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Abstract base class for processing different WhatsApp webhook field types
 */
@Slf4j
public abstract class WhatsAppWebhookFieldProcessor {

    protected final WhatsAppContactRepository contactRepository;

    protected WhatsAppWebhookFieldProcessor(WhatsAppContactRepository contactRepository) {
        this.contactRepository = contactRepository;
    }

    /**
     * Process the webhook payload for a specific field type
     * 
     * @param payload The webhook payload to process
     */
    public abstract void process(WhatsAppWebhookPayload payload);

    /**
     * Get the field type this processor handles
     * 
     * @return The webhook field type (e.g., "messages", "message_echoes", "history")
     */
    public abstract String getFieldType();

    /**
     * Process contacts from webhook payload
     */
    protected void processContacts(WhatsAppWebhookPayload payload, String webhookField) {
        if (payload.getValue() != null && payload.getValue().getContacts() != null) {
            for (WhatsAppWebhookPayload.WhatsAppContact contact : payload.getValue().getContacts()) {
                if (contact != null && contact.getProfile() != null) {
                    log.info("Processing contact: {} ({})", contact.getProfile().getName(), contact.getWaId());
                    saveContactToDatabase(contact, webhookField);
                }
            }
        }
    }

    /**
     * Save contact to database
     */
    protected void saveContactToDatabase(WhatsAppWebhookPayload.WhatsAppContact contact, String webhookField) {
        try {
            // Check if contact already exists
            Optional<WhatsAppContact> existingContact = contactRepository.findByWaId(contact.getWaId());
            
            if (existingContact.isPresent()) {
                // Update existing contact
                WhatsAppContact dbContact = existingContact.get();
                dbContact.setProfileName(contact.getProfile().getName());
                dbContact.setLastSeen(LocalDateTime.now());
                dbContact.setMessageCount(dbContact.getMessageCount() + 1);
                dbContact.setLastWebhookField(webhookField);
                dbContact.setActive(true);
                
                contactRepository.save(dbContact);
                log.info("Updated existing contact: {} ({})", contact.getProfile().getName(), contact.getWaId());
            } else {
                // Create new contact
                WhatsAppContact newContact = WhatsAppContact.builder()
                        .waId(contact.getWaId())
                        .profileName(contact.getProfile().getName())
                        .firstSeen(LocalDateTime.now())
                        .lastSeen(LocalDateTime.now())
                        .messageCount(1)
                        .isActive(true)
                        .lastWebhookField(webhookField)
                        .build();
                
                WhatsAppContact savedContact = contactRepository.save(newContact);
                log.info("Created new contact: {} ({}) with ID: {}", 
                        contact.getProfile().getName(), contact.getWaId(), savedContact.getId());
            }
            
        } catch (Exception e) {
            log.error("Error saving contact to database: {}", contact.getWaId(), e);
        }
    }
} 