package org.lite.komunas.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceCommitResponse {
    private String resourceId;
    private String resourceCategory;
    private String version;
    private String summary;
    private String status; // e.g., "COMMITTED"
}
