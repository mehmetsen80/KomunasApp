package org.lite.komunas.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request payload to commit a synchronized resource version")
public class ResourceCommitRequest {
    @Schema(description = "The USCIS Form ID to commit", example = "I-485")
    private String resourceId;
    
    @Schema(description = "The category classification", example = "forms")
    private String category;

    @Schema(description = "The descriptive name of the resource", example = "Adjustment of Status")
    private String displayName;
    
    @Schema(description = "The domain of the resource", example = "uscis-sentinel")
    private String domain;
    
    @Schema(description = "The new version string", example = "Edition 01/30/24")
    private String version;
    
    @Schema(description = "The effective date of the new version", example = "2024-01-30")
    private String effectiveDate;
    
    @Schema(description = "SHA-256 hash of the new resource")
    private String hash;
    
    @Schema(description = "Full URL to download the resource")
    private String resourceUrl;
    
    @Schema(description = "URL to the instructions document")
    private String instructionsUrl;
    
    @Schema(description = "Hash of the instructions document")
    private String instructionsHash;
    
    @Builder.Default
    @Schema(description = "Map of associated supplemental resources")
    private Map<String, SupplementalResource> supplementalResources = new HashMap<>();
    
    @Schema(description = "Document ID of the newly downloaded resource")
    private String documentId;
    
    @Schema(description = "Document ID of the newly downloaded instructions")
    private String instructionsDocumentId;
    
    @Schema(description = "Document ID of the previous version")
    private String oldDocumentId;
    
    @Schema(description = "Document ID of the previous instructions")
    private String oldInstructionsDocumentId;
    
    @Schema(description = "Type of change detected (e.g., VERSION_UPDATE, HASH_MISMATCH)")
    private String changeType;
    
    @Schema(description = "Flag indicating if a material change was detected")
    private boolean changeDetected;
    
    @Schema(description = "Human-readable summary of the commit action")
    private String summary;
    
    @Schema(description = "ISO-8601 timestamp of the verification")
    private String verifiedAt;
    
    @Schema(description = "ID of the AI Agent task that triggered this commit, if any")
    private String agentTaskId;
    
    @Schema(description = "Additional analysis payload from the extraction process")
    private Object analysis;
 
    @Schema(description = "Structured payload data to be persisted")
    private Map<String, Object> payload;
}
