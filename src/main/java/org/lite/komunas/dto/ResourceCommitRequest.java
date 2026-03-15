package org.lite.komunas.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceCommitRequest {
    private String resourceId;
    private String resourceCategory;
    private String version;
    private String effectiveDate;
    private String hash;
    private String resourceUrl;
    private String instructionsUrl;
    private String instructionsHash;
    private String documentId;
    private String instructionsDocumentId;
    private String oldDocumentId;
    private String oldInstructionsDocumentId;
    private String changeType;
    private boolean changeDetected;
    private String summary;
    private String verifiedAt;
    private String agentTaskId;
    private Object analysis;
}
