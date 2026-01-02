package org.lite.komunas.service;

import lombok.extern.slf4j.Slf4j;
import org.lite.komunas.model.WhatsAppWebhookPayload;
import org.lite.komunas.repository.WhatsAppContactRepository;
import org.lite.komunas.repository.WhatsAppMessageRepository;
import org.lite.komunas.service.impl.WhatsAppWebhookFieldHistoryService;
import org.lite.komunas.service.impl.WhatsAppWebhookFieldMessageEchoesService;
import org.lite.komunas.service.impl.WhatsAppWebhookFieldMessagesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
public class WhatsAppWebhookService {

    private final List<WhatsAppWebhookFieldProcessor> fieldProcessors = new ArrayList<>();

    @Autowired
    private WhatsAppContactRepository contactRepository;

    @Autowired
    private WhatsAppMessageRepository messageRepository;

    @PostConstruct
    public void init() {
        // Manually create and add each field processor
        fieldProcessors.add(new WhatsAppWebhookFieldMessagesService(contactRepository, messageRepository));
        fieldProcessors.add(new WhatsAppWebhookFieldMessageEchoesService(contactRepository, messageRepository));
        fieldProcessors.add(new WhatsAppWebhookFieldHistoryService(contactRepository, messageRepository));

        log.info("WhatsAppWebhookService initialized with {} field processors", fieldProcessors.size());

        fieldProcessors.forEach(processor -> log.info("Added processor: {} for field type: {}",
                processor.getClass().getSimpleName(), processor.getFieldType()));
    }

    /**
     * Process incoming webhook payload based on the field type
     */
    public void processWebhookPayload(WhatsAppWebhookPayload payload) {
        if (payload == null || payload.getField() == null) {
            log.warn("Invalid webhook payload received");
            return;
        }

        if (fieldProcessors.isEmpty()) {
            log.error("No field processors available - cannot process webhook");
            return;
        }

        log.info("Processing webhook with field type: {}", payload.getField());
        log.info("Available processors: {}", fieldProcessors.size());

        // Find the appropriate processor for this field type
        Optional<WhatsAppWebhookFieldProcessor> processor = fieldProcessors.stream()
                .filter(p -> p.getFieldType().equals(payload.getField()))
                .findFirst();

        if (processor.isPresent()) {
            processor.get().process(payload);
            log.info("Webhook processed successfully by {}", processor.get().getClass().getSimpleName());
        } else {
            log.warn("No processor found for webhook field type: {}", payload.getField());
            log.info("Available field types: {}",
                    fieldProcessors.stream().map(WhatsAppWebhookFieldProcessor::getFieldType).toList());
        }
    }
}