package org.lite.komunas.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.lite.komunas.dto.SupplementalResource;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Audit trail of every detected version change for a monitored resource.
 */
@Document(collection = "resource_version_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResourceVersionHistory {
    @Id
    private String id;

    private String domain; // e.g., "uscis-sentinel"
    private String category; // e.g., "forms", "news", "alerts"
    private String resourceId; // e.g., "I-485"
    private String displayName; // e.g., "Adjustment of Status"
    private String syncStateId; // Reference to the parent ResourceSyncState
    private String agentTaskId;

    private String version;
    private String effectiveDate;
    private String resourceUrl;
    private String instructionsUrl;

    @Builder.Default
    private Map<String, SupplementalResource> supplementalResources = new HashMap<>();

    private String hash;
    private String instructionsHash;
    private String documentId;
    private String instructionsDocumentId;
    private String oldDocumentId;
    private String oldInstructionsDocumentId;
    private String changeType;
    private String summary;
    private boolean changeDetected;
    private Object analysis; // Snapshot of the LLM analysis for this version

    private Map<String, Object> payload;

    @Builder.Default
    private boolean enabled = true;

    private LocalDateTime detectedAt;
}
