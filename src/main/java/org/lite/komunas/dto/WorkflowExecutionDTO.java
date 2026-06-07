package org.lite.komunas.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO representing a workflow or agent task execution, aligned with Linqra's
 * execution entities.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowExecutionDTO {
    private String id;
    private String agentExecutionId;
    private String workflowId;
    private String agentName;
    @JsonAlias("taskId")
    private String agentTaskId;
    @JsonAlias("taskName")
    private String agentTaskName;
    private String institution;
    private String institutionShortName;
    private String status;
    private String executedBy;
    private LocalDateTime executedAt;
    @JsonProperty("durationMs")
    @JsonAlias("executionDurationMs")
    private Long durationMs;
    private String errorMessage;
    private Map<String, Object> response;
    private Map<String, Object> variables;

    @JsonProperty("request")
    @JsonAlias("input_data")
    private Map<String, Object> input_data;

    // Helper to get the final result from the nested response structure
    @SuppressWarnings("unchecked")
    public Object getFinalResult() {
        if (response == null)
            return null;
        Object result = response.get("result");
        if (result instanceof Map) {
            Map<String, Object> resultMap = (Map<String, Object>) result;
            return resultMap.getOrDefault("finalResult", resultMap.get("outputData"));
        }
        return result;
    }

    // Helper to extract institution from input_data if not directly available
    @SuppressWarnings("unchecked")
    public String getResolvedInstitution() {
        if (institution != null && !institution.isEmpty()) {
            return institution;
        }
        if (input_data == null)
            return null;

        // Try to find in query.params.institution
        Object query = input_data.get("query");
        if (query instanceof Map) {
            Object params = ((Map<String, Object>) query).get("params");
            if (params instanceof Map) {
                Object inst = ((Map<String, Object>) params).get("institution");
                if (inst != null) {
                    return String.valueOf(inst);
                }
            }
        }
        return null;
    }
}
