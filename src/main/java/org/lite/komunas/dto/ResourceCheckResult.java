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
@Schema(description = "Detailed result of a USCIS resource version check")
public class ResourceCheckResult {
    @Schema(description = "The USCIS Form ID (e.g., I-485, I-130)", example = "I-485")
    private String resourceId;
    
    @Schema(description = "The resource domain", example = "uscis-sentinel")
    private String domain;
    
    @Schema(description = "The resource category", example = "announcements")
    private String category;

    @Schema(description = "The descriptive name of the resource", example = "Adjustment of Status")
    private String displayName;
    
    @Schema(description = "Indicates if the user is subscribed to this resource", example = "true")
    private boolean subscribed;
    
    @Schema(description = "The Linqra subscription ID, if applicable", example = "sub_12345")
    private String subscriptionId;
    
    @Schema(description = "Indicates if a change was detected since the last check", example = "true")
    private boolean changed;
    
    @Schema(description = "The previous version string found in history", example = "Edition 12/23/22")
    private String oldVersion;
    
    @Schema(description = "The current version string discovered on the website", example = "Edition 01/30/24")
    private String newVersion;

    @Schema(description = "A human-readable summary of the detected change", example = "New policy guidance: Technical Update...")
    private String summary;
    
    @Schema(description = "The effective date of the current version", example = "2024-01-30")
    private String effectiveDate;
    
    @Schema(description = "SHA-256 hash of the previous resource version")
    private String oldHash;
    
    @Schema(description = "SHA-256 hash of the current resource version")
    private String newHash;
    
    @Schema(description = "Full URL to download the current resource", example = "https://www.uscis.gov/sites/default/files/document/forms/i-485.pdf")
    private String resourceUrl;
    
    @Schema(description = "URL to the separate instructions document, if applicable")
    private String instructionsUrl;
    
    @Schema(description = "Hash of the instructions document")
    private String instructionsHash;
    
    @Builder.Default
    @Schema(description = "Map of supplemental resources (supplements, G-1145, etc.)")
    private Map<String, SupplementalResource> supplementalResources = new HashMap<>();
    
    @Schema(description = "Internal document ID of the old version")
    private String oldDocumentId;
    
    @Schema(description = "Internal document ID of the old instructions")
    private String oldInstructionsDocumentId;
    
    @Schema(description = "Suggests whether a full synchronization is needed", example = "true")
    private boolean shouldSync;

    @Builder.Default
    @Schema(description = "Generic payload for structured resource data (e.g., newsroom alert lists)")
    private Map<String, Object> payload = new HashMap<>();
}
