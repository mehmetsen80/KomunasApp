package org.lite.komunas.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Tracks the current state of a resource being monitored by an agent (e.g., a
 * USCIS Form).
 */
@Document(collection = "resource_sync_state")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@CompoundIndexes({
        @CompoundIndex(name = "resource_sync_idx", def = "{'resourceCategory': 1, 'resourceId': 1}", unique = true)
})
public class ResourceSyncState {
    @Id
    private String id;

    private String resourceCategory; // e.g., "uscis-sentinel"
    private String resourceId; // e.g., "I-485"
    private String agentTaskId; // Link to Linq Agent Task
    private String resourceUrl;
    private String instructionsUrl;
    private String supplementalUrl;

    private String lastKnownVersion; // e.g., "04/01/24"
    private String effectiveDate;
    private String lastKnownHash; // e.g., SHA-256 of the PDF
    private String lastKnownInstructionsHash;
    private String lastKnownSupplementalHash;

    private String documentId; // Link to KnowledgeHubDocument
    private String instructionsDocumentId;
    private String supplementalDocumentId;
    private String oldDocumentId;
    private String oldInstructionsDocumentId;
    private String oldSupplementalDocumentId;
    private String changeType;
    private String summary;
    private boolean changeDetected;
    private Object lastAnalysis; // Latest LLM analysis summary

    private LocalDateTime lastCheckedAt;
    private LocalDateTime lastUpdatedAt;

    // Flexible storage for agent-specific state
    private Map<String, Object> metadata;

    @Builder.Default
    private boolean enabled = true;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
