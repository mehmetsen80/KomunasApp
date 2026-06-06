package org.lite.komunas.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO representing a paginated response of workflow executions.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaginatedExecutionsDTO {
    private List<WorkflowExecutionDTO> executions;
    private long total;
    private int limit;
}
