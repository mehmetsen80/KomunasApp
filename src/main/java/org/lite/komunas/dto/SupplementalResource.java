package org.lite.komunas.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplementalResource {
    private String name;
    private String url;
    private String hash;
    private String documentId;
    private String oldDocumentId;
}
