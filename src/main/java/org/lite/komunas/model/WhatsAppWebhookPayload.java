package org.lite.komunas.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class WhatsAppWebhookPayload {
    private String field;
    private WebhookValue value;

    @Data
    public static class WebhookValue {
        @JsonProperty("messaging_product")
        private String messagingProduct;
        private WhatsAppMetadata metadata;
        private WhatsAppContact[] contacts;
        @JsonProperty("messages")
        private WhatsAppMessage[] messages;
        @JsonProperty("message_echoes")
        private WhatsAppMessageEcho[] messageEchoes;
        @JsonProperty("history")
        private WhatsAppHistory[] history;
    }

    @Data
    public static class WhatsAppMetadata {
        @JsonProperty("display_phone_number")
        private String displayPhoneNumber;
        @JsonProperty("phone_number_id")
        private String phoneNumberId;
    }

    @Data
    public static class WhatsAppContact {
        private WhatsAppProfile profile;
        @JsonProperty("wa_id")
        private String waId;
    }

    @Data
    public static class WhatsAppProfile {
        private String name;
    }

    @Data
    public static class WhatsAppMessage {
        private String from;
        private String id;
        private String timestamp;
        private String type;
        private WhatsAppText text;
        @JsonProperty("history_context")
        private WhatsAppHistoryContext historyContext;
    }

    @Data
    public static class WhatsAppMessageEcho {
        private String from;
        private String to;
        private String id;
        private String timestamp;
        private String type;
        @JsonProperty("message_creation_type")
        private String messageCreationType;
        private WhatsAppText text;
    }

    @Data
    public static class WhatsAppText {
        private String body;
    }

    @Data
    public static class WhatsAppHistoryContext {
        private String status;
        @JsonProperty("from_me")
        private boolean fromMe;
    }

    @Data
    public static class WhatsAppHistory {
        private WhatsAppHistoryMetadata metadata;
        private WhatsAppThread[] threads;
    }

    @Data
    public static class WhatsAppHistoryMetadata {
        private int phase;
        @JsonProperty("chunk_order")
        private int chunkOrder;
        private int progress;
    }

    @Data
    public static class WhatsAppThread {
        private String id;
        private WhatsAppMessage[] messages;
    }
} 