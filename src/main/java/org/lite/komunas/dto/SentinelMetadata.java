package org.lite.komunas.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SentinelMetadata {
    private String version;
    private String effectiveDate;
    private String resourceUrl;
    private String instructionsUrl;
    private String supplementalUrl;
}
