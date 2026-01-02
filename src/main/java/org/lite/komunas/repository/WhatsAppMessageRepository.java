package org.lite.komunas.repository;

import org.lite.komunas.entity.WhatsAppMessage;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface WhatsAppMessageRepository extends MongoRepository<WhatsAppMessage, String> {

    /**
     * Find message by WhatsApp ID
     */
    Optional<WhatsAppMessage> findByWhatsappId(String whatsappId);

    /**
     * Find messages by sender phone number
     */
    List<WhatsAppMessage> findByFromNumber(String fromNumber);

    /**
     * Find messages by conversation ID
     */
    List<WhatsAppMessage> findByConversationId(String conversationId);

    /**
     * Find messages by webhook field type
     */
    List<WhatsAppMessage> findByWebhookField(String webhookField);

    /**
     * Find messages by message type
     */
    List<WhatsAppMessage> findByMessageType(String messageType);

    /**
     * Find messages by status
     */
    List<WhatsAppMessage> findByStatus(String status);

    /**
     * Find messages from a specific date range
     */
    @Query("{'createdAt': {$gte: ?0, $lte: ?1}}")
    List<WhatsAppMessage> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);

    /**
     * Find messages from a specific timestamp onwards
     */
    @Query("{'timestamp': {$gte: ?0}}")
    List<WhatsAppMessage> findByTimestampGreaterThanEqual(String timestamp);

    /**
     * Find messages between two timestamps
     */
    @Query("{'timestamp': {$gte: ?0, $lte: ?1}}")
    List<WhatsAppMessage> findByTimestampBetween(String fromTimestamp, String toTimestamp);

    /**
     * Find messages containing specific text (case-insensitive)
     */
    @Query("{'messageBody': {$regex: ?0, $options: 'i'}}")
    List<WhatsAppMessage> findByMessageBodyContainingIgnoreCase(String text);

    /**
     * Find messages by contact name (case-insensitive)
     */
    @Query("{'contactName': {$regex: ?0, $options: 'i'}}")
    List<WhatsAppMessage> findByContactNameContainingIgnoreCase(String contactName);

    /**
     * Check if message exists by WhatsApp ID
     */
    boolean existsByWhatsappId(String whatsappId);
}