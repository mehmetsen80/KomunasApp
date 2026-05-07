package org.lite.komunas.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.lite.komunas.entity.ResourceVersionHistory;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Response payload for GET /api/uscis/status/check/{formId}.
 * Combines the current sync state with ordered version history.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class USCISStatusResponse {

    // Core identity
    private String resourceId;         // e.g., "I-485"
    private String domain;             // e.g., "uscis-sentinel"
    private String category;           // e.g., "forms", "news", "alerts"

    // Subscription status
    private boolean subscribed;
    private String subscriptionId;

    // Current state
    private String currentVersion;     // latest known version string
    private String effectiveDate;
    private String resourceUrl;
    private String instructionsUrl;
    private Map<String, SupplementalResource> supplementalResources;

    // Change tracking
    private boolean changeDetected;
    private String changeType;
    private String summary;

    // Monitoring metadata
    private LocalDateTime lastCheckedAt;
    private LocalDateTime lastUpdatedAt;
    private boolean enabled;
    private Map<String, Object> payload;

    // Full version history, newest first
    private List<VersionEntry> versionHistory;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VersionEntry {
        private String version;
        private String effectiveDate;
        private String changeType;
        private String summary;
        private boolean changeDetected;
        private String resourceUrl;
        private String instructionsUrl;
        private Map<String, SupplementalResource> supplementalResources;
        private String documentId;
        private LocalDateTime detectedAt;
    }

    /** Convenience factory — builds a VersionEntry from a ResourceVersionHistory entity. */
    public static VersionEntry from(ResourceVersionHistory h) {
        return VersionEntry.builder()
                .version(h.getVersion())
                .effectiveDate(h.getEffectiveDate())
                .changeType(h.getChangeType())
                .summary(h.getSummary())
                .changeDetected(h.isChangeDetected())
                .resourceUrl(h.getResourceUrl())
                .instructionsUrl(h.getInstructionsUrl())
                .supplementalResources(h.getSupplementalResources())
                .documentId(h.getDocumentId())
                .detectedAt(h.getDetectedAt())
                .build();
    }
}
