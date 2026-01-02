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
@Document(collection = "whatsapp_contacts")
public class WhatsAppContact {

    @Id
    private String id;

    @Indexed(unique = true)
    @Field("wa_id")
    private String waId; // WhatsApp user ID (e.g., "16315551181")

    @Field("profile_name")
    private String profileName; // Contact's display name

    @Field("phone_number")
    private String phoneNumber; // Phone number if available

    @Field("first_seen")
    private LocalDateTime firstSeen; // When we first received a message from this contact

    @Field("last_seen")
    private LocalDateTime lastSeen; // When we last received a message from this contact

    @Field("message_count")
    private int messageCount; // Total number of messages from this contact

    @Field("is_active")
    private boolean isActive; // Whether the contact is currently active

    @Field("last_webhook_field")
    private String lastWebhookField; // Last webhook type that included this contact

    @Field("created_at")
    @CreatedDate
    private LocalDateTime createdAt;

    @Field("updated_at")
    @LastModifiedDate
    private LocalDateTime updatedAt;
}