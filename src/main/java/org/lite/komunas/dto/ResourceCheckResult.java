package org.lite.komunas.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
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
    private String g1151Url;
    private String g1151Hash;
    private String oldDocumentId;
    private String oldInstructionsDocumentId;
    private String oldG1151DocumentId;
    private boolean shouldSync;
}
