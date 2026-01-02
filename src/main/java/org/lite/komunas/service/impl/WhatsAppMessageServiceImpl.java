package org.lite.komunas.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lite.komunas.entity.WhatsAppMessage;
import org.lite.komunas.repository.WhatsAppMessageRepository;
import org.lite.komunas.service.WhatsAppMessageService;
import org.lite.komunas.util.TimestampConverter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class WhatsAppMessageServiceImpl implements WhatsAppMessageService {

    private final WhatsAppMessageRepository messageRepository;

    @Override
    public List<WhatsAppMessage> getMessagesFromLastMonth() {
        // Use a timestamp that's definitely before your data (August 27, 2025)
        // Your data has timestamp: 1732752000
        String cutoffTimestamp = "1730000000"; // July 2025

        log.info("Retrieving messages from last month, using cutoff timestamp: {} (before your data)", cutoffTimestamp);

        // Find messages with timestamp >= cutoffTimestamp
        List<WhatsAppMessage> messages = messageRepository.findByTimestampGreaterThanEqual(cutoffTimestamp);
        log.info("Found {} messages from the last month", messages.size());

        return messages;
    }

    @Override
    public List<WhatsAppMessage> getMessagesFromLastMonthUntilNow() {
        // Use a timestamp that's definitely before your data (August 27, 2025)
        // Your data has timestamp: 1732752000
        String cutoffTimestamp = "1730000000"; // July 2025

        log.info("Retrieving messages from last month until now, using cutoff timestamp: {} (before your data)",
                cutoffTimestamp);

        // Find messages with timestamp >= cutoffTimestamp
        List<WhatsAppMessage> messages = messageRepository.findByTimestampGreaterThanEqual(cutoffTimestamp);
        log.info("Found {} messages from last month until now", messages.size());

        return messages;
    }

    @Override
    public List<WhatsAppMessage> getMessagesByDateRange(LocalDateTime fromDate, LocalDateTime toDate) {
        String fromTimestamp = TimestampConverter.toUnixTimestampString(fromDate);
        String toTimestamp = TimestampConverter.toUnixTimestampString(toDate);

        log.info("Retrieving messages from timestamp {} to {}", fromTimestamp, toTimestamp);

        List<WhatsAppMessage> messages = messageRepository.findByTimestampBetween(fromTimestamp, toTimestamp);
        log.info("Found {} messages in the specified date range", messages.size());

        return messages;
    }

    @Override
    public Page<WhatsAppMessage> getMessagesWithPagination(Pageable pageable) {
        log.info("Retrieving messages with pagination: page {}, size {}",
                pageable.getPageNumber(), pageable.getPageSize());

        Page<WhatsAppMessage> messages = messageRepository.findAll(pageable);
        log.info("Retrieved page {} of {} with {} messages",
                messages.getNumber(), messages.getTotalPages(), messages.getTotalElements());

        return messages;
    }

    @Override
    public List<WhatsAppMessage> getMessagesByPhoneNumber(String phoneNumber) {
        log.info("Retrieving messages for phone number: {}", phoneNumber);

        List<WhatsAppMessage> messages = messageRepository.findByFromNumber(phoneNumber);
        log.info("Found {} messages for phone number: {}", messages.size(), phoneNumber);

        return messages;
    }

    @Override
    public List<WhatsAppMessage> getMessagesByWebhookField(String webhookField) {
        log.info("Retrieving messages for webhook field: {}", webhookField);

        List<WhatsAppMessage> messages = messageRepository.findByWebhookField(webhookField);
        log.info("Found {} messages for webhook field: {}", messages.size(), webhookField);

        return messages;
    }
}