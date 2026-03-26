package org.lite.komunas.dto;

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
public class ResourceCheckResult {
    private String resourceId;
    private boolean changed;
    private String oldVersion;
    private String newVersion;
    private String effectiveDate;
    private String oldHash;
    private String currentHash;
    private String resourceUrl;
    private String instructionsUrl;
    private String instructionsHash;
    
    @Builder.Default
    private Map<String, SupplementalResource> supplementalResources = new HashMap<>();
    
    private String oldDocumentId;
    private String oldInstructionsDocumentId;
    private boolean shouldSync;
}
