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
public class SentinelMetadata {
    private String displayName;
    private String version;
    private String effectiveDate;
    private String resourceUrl;
    private String instructionsUrl;

    @Builder.Default
    private Map<String, SupplementalResource> supplementalResources = new HashMap<>();
}
