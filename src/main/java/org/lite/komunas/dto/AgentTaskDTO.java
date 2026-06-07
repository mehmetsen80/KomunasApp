package org.lite.komunas.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AgentTaskDTO {
    private String id;
    private String name;
    private String description;
    private String taskType;
    private String agentId;
    private int priority;
    private boolean enabled;
    private int maxRetries;
    private int timeoutMinutes;
    private String cronExpression;
    private String cronDescription;
    private String executionTrigger;
    private boolean scheduleOnStartup;
    private LocalDateTime nextRun;
    private LocalDateTime lastRun;
    private Map<String, Object> linqConfig;
    private Map<String, Object> apiConfig;
    private String scriptContent;
    private String scriptLanguage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
    private Integer version;
}
