package org.lite.komunas.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

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

    private String resourceCategory;
    private String resourceId;
    private String agentTaskId;

    private String version;
    private String hash;
    private String resourceUrl;
    private String documentId;
    private String oldDocumentId;
    private String changeType;
    private String summary;
    private boolean changeDetected;
    private Object analysis; // Snapshot of the LLM analysis for this version

    private LocalDateTime detectedAt;
}
