package org.lite.komunas.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponseDTO {
    private String id;
    private String subscriptionId;
    private String resourceCategory;
    private String resourceId;
    private String type;
    private String severity;
    private String summary;
    private String details;
    private Map<String, Object> delta;
    private boolean read;
    private LocalDateTime createdAt;
}
