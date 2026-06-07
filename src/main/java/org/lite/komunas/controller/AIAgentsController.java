package org.lite.komunas.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lite.komunas.client.LinqraClient;
import org.lite.komunas.dto.PaginatedExecutionsDTO;
import org.lite.komunas.dto.WorkflowExecutionDTO;
import org.lite.komunas.dto.AgentTaskDTO;
import org.lite.komunas.dto.AgentDTO;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/ai-agents")
@RequiredArgsConstructor
@Slf4j
public class AIAgentsController {

    private final LinqraClient linqraClient;

    @Value("${gateway.uscis-form-monitor-agent-id}")
    private String formMonitorAgentId;

    @Value("${gateway.uscis-newsroom-monitor-agent-id}")
    private String newsroomMonitorAgentId;

    @Value("${gateway.uscis-processing-time-agent-id}")
    private String processingTimeAgentId;

    /**
     * Get paginated executions for a specific agent type
     * 
     * @param type  The type of agent (forms, newsroom, processing-times)
     * @param limit Number of executions to fetch
     * @return PaginatedExecutionsDTO
     */
    @GetMapping("/executions")
    public ResponseEntity<PaginatedExecutionsDTO> getExecutions(
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "10") int limit) {

        String agentId = null;
        if (type != null) {
            switch (type.toLowerCase()) {
                case "forms":
                    agentId = formMonitorAgentId;
                    break;
                case "newsroom":
                    agentId = newsroomMonitorAgentId;
                    break;
                case "processing-times":
                    agentId = processingTimeAgentId;
                    break;
                default:
                    log.warn("Unknown agent type requested: {}", type);
            }
        }

        log.info("Fetching {} agent executions for type: {} (AgentId: {})", limit, type, agentId);
        PaginatedExecutionsDTO executions = linqraClient.fetchAllExecutions(agentId, null, limit);
        return ResponseEntity.ok(executions);
    }

    /**
     * Get details of a specific execution
     */
    @GetMapping("/executions/{executionId}")
    public ResponseEntity<WorkflowExecutionDTO> getExecutionDetails(@PathVariable String executionId) {
        WorkflowExecutionDTO execution = linqraClient.getAgentExecution(executionId);
        if (execution == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(execution);
    }

    /**
     * Cancel an ongoing execution
     */
    @PostMapping("/executions/{executionId}/cancel")
    public ResponseEntity<Void> cancelExecution(@PathVariable String executionId) {
        boolean success = linqraClient.cancelAgentExecution(executionId);
        if (success) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.internalServerError().build();
    }

    /**
     * Get tasks for a specific agent type
     */
    @GetMapping("/tasks")
    public ResponseEntity<List<AgentTaskDTO>> getAgentTasks(
            @RequestParam(required = false) String type,
            HttpServletRequest request) {

        String agentId = null;
        if (type != null) {
            switch (type.toLowerCase()) {
                case "forms":
                    agentId = formMonitorAgentId;
                    break;
                case "newsroom":
                    agentId = newsroomMonitorAgentId;
                    break;
                case "processing-times":
                    agentId = processingTimeAgentId;
                    break;
                default:
                    log.warn("Unknown agent type requested for tasks: {}", type);
            }
        }

        if (agentId == null) {
            return ResponseEntity.badRequest().build();
        }

        // Extract the Bearer token from the incoming browser request.
        String authHeader = request.getHeader(org.springframework.http.HttpHeaders.AUTHORIZATION);
        String bearerToken = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            bearerToken = authHeader.substring(7);
        }

        if (bearerToken == null) {
            log.warn("No Bearer token found in request for agent tasks: {}", type);
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }

        log.info("Fetching agent tasks for type: {} (AgentId: {})", type, agentId);
        List<AgentTaskDTO> tasks = linqraClient.getAgentTasks(agentId, bearerToken);
        return ResponseEntity.ok(tasks);
    }

    /**
     * Get details for all configured agents in one batch call
     */
    @GetMapping("/list")
    public ResponseEntity<List<AgentDTO>> getAgents(HttpServletRequest request) {
        // Extract the Bearer token from the incoming browser request.
        String authHeader = request.getHeader(org.springframework.http.HttpHeaders.AUTHORIZATION);
        String bearerToken = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            bearerToken = authHeader.substring(7);
        }

        if (bearerToken == null) {
            log.warn("No Bearer token found in request for getAgents");
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }

        List<String> agentIds = List.of(formMonitorAgentId, newsroomMonitorAgentId, processingTimeAgentId);
        log.info("Fetching details for agents: {}", agentIds);
        List<AgentDTO> agents = linqraClient.getAgentsList(agentIds, bearerToken);
        return ResponseEntity.ok(agents);
    }
}
