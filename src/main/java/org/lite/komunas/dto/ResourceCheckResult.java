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
    private String oldHash;
    private String currentHash;
    private String resourceUrl;
    private String oldDocumentId;
    private boolean shouldSync;
}
