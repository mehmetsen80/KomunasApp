package org.lite.komunas.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Response returned after successfully committing a resource update")
public class ResourceCommitResponse {
    @Schema(description = "The USCIS Form ID that was committed", example = "I-485")
    private String resourceId;
    
    @Schema(description = "The category of the resource", example = "uscis-sentinel")
    private String resourceCategory;
    
    @Schema(description = "The version string that was committed", example = "Edition 01/30/24")
    private String version;
    
    @Schema(description = "Summary message of the operation", example = "Successfully committed I-485 Edition 01/30/24")
    private String summary;
    
    @Schema(description = "Status of the commit operation", example = "COMMITTED")
    private String status;
}
