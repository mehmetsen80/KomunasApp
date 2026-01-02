package org.lite.komunas.service;

import org.lite.komunas.entity.WhatsAppMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

public interface WhatsAppMessageService {

    /**
     * Retrieve messages from the last month
     * 
     * @return List of WhatsApp messages from the last 30 days
     */
    List<WhatsAppMessage> getMessagesFromLastMonth();

    /**
     * Retrieve messages from a specific date range
     * 
     * @param fromDate Start date (inclusive)
     * @param toDate   End date (inclusive)
     * @return List of WhatsApp messages in the date range
     */
    List<WhatsAppMessage> getMessagesByDateRange(LocalDateTime fromDate, LocalDateTime toDate);

    /**
     * Retrieve messages from last month until now (more flexible than fixed 30
     * days)
     * 
     * @return List of WhatsApp messages from last month until current time
     */
    List<WhatsAppMessage> getMessagesFromLastMonthUntilNow();

    /**
     * Retrieve messages with pagination
     * 
     * @param pageable Pagination parameters
     * @return Page of WhatsApp messages
     */
    Page<WhatsAppMessage> getMessagesWithPagination(Pageable pageable);

    /**
     * Retrieve messages by phone number
     * 
     * @param phoneNumber Phone number to search for
     * @return List of WhatsApp messages for the specified phone number
     */
    List<WhatsAppMessage> getMessagesByPhoneNumber(String phoneNumber);

    /**
     * Retrieve messages by webhook field type
     * 
     * @param webhookField Webhook field type (messages, message_echoes, history)
     * @return List of WhatsApp messages for the specified webhook field
     */
    List<WhatsAppMessage> getMessagesByWebhookField(String webhookField);
}