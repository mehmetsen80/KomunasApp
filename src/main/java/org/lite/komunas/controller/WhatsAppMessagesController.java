package org.lite.komunas.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lite.komunas.entity.WhatsAppMessage;
import org.lite.komunas.service.WhatsAppMessageService;
import org.lite.komunas.util.TimestampConverter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/whatsapp/messages")
@RequiredArgsConstructor
@Tag(name = "WhatsApp Messages", description = "APIs for retrieving WhatsApp messages from MongoDB")
public class WhatsAppMessagesController {

    private final WhatsAppMessageService messageService;

    @GetMapping
    @Operation(
        summary = "Get messages from the last month",
        description = "Retrieves all WhatsApp messages from the last 30 days from MongoDB"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Successfully retrieved messages",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = WhatsAppMessage.class)
            )
        ),
        @ApiResponse(
            responseCode = "500",
            description = "Internal server error"
        )
    })
    public ResponseEntity<List<WhatsAppMessage>> getMessagesFromLastMonth() {
        log.info("GET /whatsapp/messages - Retrieving messages from last month");
        
        try {
            List<WhatsAppMessage> messages = messageService.getMessagesFromLastMonth();
            log.info("Successfully retrieved {} messages from last month", messages.size());
            
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            log.error("Error retrieving messages from last month", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/last-month-until-now")
    @Operation(
        summary = "Get messages from last month until now",
        description = "Retrieves WhatsApp messages from exactly 1 month ago until current time (more flexible than fixed 30 days)"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Successfully retrieved messages",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = WhatsAppMessage.class)
            )
        ),
        @ApiResponse(
            responseCode = "500",
            description = "Internal server error"
        )
    })
    public ResponseEntity<List<WhatsAppMessage>> getMessagesFromLastMonthUntilNow() {
        log.info("GET /whatsapp/messages/last-month-until-now - Retrieving messages from last month until now");
        
        try {
            List<WhatsAppMessage> messages = messageService.getMessagesFromLastMonthUntilNow();
            log.info("Successfully retrieved {} messages from last month until now", messages.size());
            
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            log.error("Error retrieving messages from last month until now", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/date-range")
    @Operation(
        summary = "Get messages by date range",
        description = "Retrieves WhatsApp messages within a specified date range"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Successfully retrieved messages",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = WhatsAppMessage.class)
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid date parameters"
        ),
        @ApiResponse(
            responseCode = "500",
            description = "Internal server error"
        )
    })
    public ResponseEntity<List<WhatsAppMessage>> getMessagesByDateRange(
            @Parameter(description = "Start date (ISO format: yyyy-MM-dd'T'HH:mm:ss)", example = "2024-01-01T00:00:00")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            
            @Parameter(description = "End date (ISO format: yyyy-MM-dd'T'HH:mm:ss)", example = "2024-01-31T23:59:59")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate) {
        
        log.info("GET /whatsapp/messages/date-range - Retrieving messages from {} to {}", fromDate, toDate);
        
        try {
            if (fromDate.isAfter(toDate)) {
                log.warn("Invalid date range: fromDate {} is after toDate {}", fromDate, toDate);
                return ResponseEntity.badRequest().build();
            }
            
            List<WhatsAppMessage> messages = messageService.getMessagesByDateRange(fromDate, toDate);
            log.info("Successfully retrieved {} messages in date range", messages.size());
            
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            log.error("Error retrieving messages by date range", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/paginated")
    @Operation(
        summary = "Get messages with pagination",
        description = "Retrieves WhatsApp messages with pagination support"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Successfully retrieved messages",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = Page.class)
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid pagination parameters"
        ),
        @ApiResponse(
            responseCode = "500",
            description = "Internal server error"
        )
    })
    public ResponseEntity<Page<WhatsAppMessage>> getMessagesWithPagination(
            @Parameter(description = "Page number (0-based)", example = "0")
            @RequestParam(defaultValue = "0") int page,
            
            @Parameter(description = "Page size", example = "20")
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("GET /whatsapp/messages/paginated - Page: {}, Size: {}", page, size);
        
        try {
            if (page < 0 || size <= 0 || size > 100) {
                log.warn("Invalid pagination parameters: page={}, size={}", page, size);
                return ResponseEntity.badRequest().build();
            }
            
            Pageable pageable = PageRequest.of(page, size);
            Page<WhatsAppMessage> messages = messageService.getMessagesWithPagination(pageable);
            log.info("Successfully retrieved page {} of {} with {} messages", 
                    messages.getNumber(), messages.getTotalPages(), messages.getTotalElements());
            
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            log.error("Error retrieving messages with pagination", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/phone/{phoneNumber}")
    @Operation(
        summary = "Get messages by phone number",
        description = "Retrieves all WhatsApp messages for a specific phone number"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Successfully retrieved messages",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = WhatsAppMessage.class)
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid phone number"
        ),
        @ApiResponse(
            responseCode = "500",
            description = "Internal server error"
        )
    })
    public ResponseEntity<List<WhatsAppMessage>> getMessagesByPhoneNumber(
            @Parameter(description = "Phone number to search for", example = "1234567890")
            @PathVariable String phoneNumber) {
        
        log.info("GET /whatsapp/messages/phone/{} - Retrieving messages for phone number", phoneNumber);
        
        try {
            if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
                log.warn("Invalid phone number: {}", phoneNumber);
                return ResponseEntity.badRequest().build();
            }
            
            List<WhatsAppMessage> messages = messageService.getMessagesByPhoneNumber(phoneNumber.trim());
            log.info("Successfully retrieved {} messages for phone number: {}", messages.size(), phoneNumber);
            
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            log.error("Error retrieving messages by phone number: {}", phoneNumber, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/webhook-field/{webhookField}")
    @Operation(
        summary = "Get messages by webhook field type",
        description = "Retrieves WhatsApp messages for a specific webhook field type (messages, message_echoes, history)"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Successfully retrieved messages",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = WhatsAppMessage.class)
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid webhook field type"
        ),
        @ApiResponse(
            responseCode = "500",
            description = "Internal server error"
        )
    })
    public ResponseEntity<List<WhatsAppMessage>> getMessagesByWebhookField(
            @Parameter(description = "Webhook field type", example = "messages", schema = @Schema(allowableValues = {"messages", "message_echoes", "history"}))
            @PathVariable String webhookField) {
        
        log.info("GET /whatsapp/messages/webhook-field/{} - Retrieving messages for webhook field", webhookField);
        
        try {
            if (webhookField == null || webhookField.trim().isEmpty()) {
                log.warn("Invalid webhook field: {}", webhookField);
                return ResponseEntity.badRequest().build();
            }
            
            List<WhatsAppMessage> messages = messageService.getMessagesByWebhookField(webhookField.trim());
            log.info("Successfully retrieved {} messages for webhook field: {}", messages.size(), webhookField);
            
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            log.error("Error retrieving messages by webhook field: {}", webhookField, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/debug/timestamp")
    @Operation(
        summary = "Debug timestamp conversion",
        description = "Utility endpoint to help debug timestamp conversion between LocalDateTime and Unix timestamps"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Timestamp conversion information"
        )
    })
    public ResponseEntity<String> debugTimestampConversion() {
        LocalDateTime now = LocalDateTime.now();
        String currentTimestamp = TimestampConverter.getCurrentUnixTimestampString();
        String oneMonthAgoTimestamp = TimestampConverter.getUnixTimestampStringDaysAgo(30);
        
        String debugInfo = String.format(
            "Current LocalDateTime: %s%n" +
            "Current Unix Timestamp: %s%n" +
            "One Month Ago Unix Timestamp: %s%n" +
            "Your MongoDB timestamp format: \"1504902988\"",
            now, currentTimestamp, oneMonthAgoTimestamp
        );
        
        log.info("Debug timestamp conversion requested");
        return ResponseEntity.ok(debugInfo);
    }
} 