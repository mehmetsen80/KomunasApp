package org.lite.komunas.repository;

import org.lite.komunas.entity.WhatsAppContact;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface WhatsAppContactRepository extends MongoRepository<WhatsAppContact, String> {

    /**
     * Find contact by WhatsApp ID
     */
    Optional<WhatsAppContact> findByWaId(String waId);

    /**
     * Find contacts by profile name (case-insensitive)
     */
    @Query("{'profileName': {$regex: ?0, $options: 'i'}}")
    List<WhatsAppContact> findByProfileNameContainingIgnoreCase(String profileName);

    /**
     * Find contacts by phone number
     */
    List<WhatsAppContact> findByPhoneNumber(String phoneNumber);

    /**
     * Find active contacts
     */
    List<WhatsAppContact> findByIsActiveTrue();

    /**
     * Find contacts by last webhook field
     */
    List<WhatsAppContact> findByLastWebhookField(String webhookField);

    /**
     * Find contacts seen in a date range
     */
    @Query("{'lastSeen': {$gte: ?0, $lte: ?1}}")
    List<WhatsAppContact> findByLastSeenBetween(LocalDateTime startDate, LocalDateTime endDate);

    /**
     * Find contacts with message count above threshold
     */
    List<WhatsAppContact> findByMessageCountGreaterThan(int threshold);

    /**
     * Find contacts by first seen date range
     */
    @Query("{'firstSeen': {$gte: ?0, $lte: ?1}}")
    List<WhatsAppContact> findByFirstSeenBetween(LocalDateTime startDate, LocalDateTime endDate);

    /**
     * Check if contact exists by WhatsApp ID
     */
    boolean existsByWaId(String waId);

    /**
     * Find contacts by message count range
     */
    @Query("{'messageCount': {$gte: ?0, $lte: ?1}}")
    List<WhatsAppContact> findByMessageCountBetween(int minCount, int maxCount);
}