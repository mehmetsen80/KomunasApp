package org.lite.komunas.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "whatsapp_messages")
public class WhatsAppMessage {

    @Id
    private String id;

    @Indexed
    @Field("whatsapp_id")
    private String whatsappId; // The ID from WhatsApp (e.g., "ABGGFlA5Fpa")

    @Indexed
    @Field("from_number")
    private String fromNumber; // The sender's phone number

    @Field("to_number")
    private String toNumber; // The recipient's phone number (if available)

    @Field("message_type")
    private String messageType; // "text", "media", etc.

    @Field("message_body")
    private String messageBody; // The actual message content

    @Field("media_url")
    private String mediaUrl; // URL for media messages

    @Field("media_id")
    private String mediaId; // Media ID for media messages

    @Field("media_caption")
    private String mediaCaption; // Caption for media messages

    @Field("timestamp")
    private String timestamp; // WhatsApp timestamp (e.g., "1504902988")

    @Field("conversation_id")
    private String conversationId; // To group messages in conversations

    @Field("phone_number_id")
    private String phoneNumberId; // WhatsApp Business phone number ID

    @Field("display_phone_number")
    private String displayPhoneNumber; // The business phone number

    @Field("contact_name")
    private String contactName; // Contact's profile name if available

    @Field("wa_id")
    private String waId; // WhatsApp user ID

    @Field("webhook_field")
    private String webhookField; // "messages", "message_echoes", "history"

    @Field("is_from_me")
    private boolean isFromMe; // Whether the message is from the business

    @Field("status")
    private String status; // Message status if available

    @CreatedDate
    @Field("created_at")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Field("updated_at")
    private LocalDateTime updatedAt;
} 