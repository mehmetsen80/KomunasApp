package org.lite.komunas.client;

import lombok.extern.slf4j.Slf4j;
import org.lite.komunas.dto.EmailRequestDTO;
import org.lite.komunas.dto.NotificationResponseDTO;
import org.lite.komunas.dto.TeamDTO;
import org.lite.komunas.dto.PaginatedExecutionsDTO;
import org.lite.komunas.dto.WorkflowExecutionDTO;
import org.lite.komunas.dto.AgentTaskDTO;
import org.lite.komunas.dto.AgentDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Client for interacting with the Linqra Gateway platform.
 */
@Component
@Slf4j
public class LinqraClient {

    private final RestTemplate restTemplate;
    private final String baseUrl;

    public LinqraClient(RestTemplate restTemplate,
            @Value("${gateway.base-url:http://api-gateway-service:7777}") String baseUrl) {
        this.restTemplate = restTemplate;
        this.baseUrl = baseUrl;
    }

    /**
     * Dispatch an email through the Linqra Gateway
     */
    public boolean sendEmail(EmailRequestDTO request) {
        log.info("Dispatching email request to Linqra Gateway for: {}", request.getTo());
        try {
            ResponseEntity<Object> response = restTemplate.postForEntity(
                    baseUrl + "/api/mail/send",
                    new HttpEntity<>(request),
                    Object.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.error("Failed to dispatch email through Linqra Gateway: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Fetch all subscriptions for a specific user from the Linqra Gateway
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getSubscriptions(String userId) {
        log.info("Fetching subscriptions from Linqra Gateway for user: {}", userId);
        try {
            String url = baseUrl + "/api/subscriptions/all/{userId}";
            ResponseEntity<List> response = restTemplate.getForEntity(url, List.class, userId);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return (List<Map<String, Object>>) response.getBody();
            }
            return Collections.emptyList();
        } catch (Exception e) {
            log.error("Failed to fetch subscriptions from Linqra Gateway: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    public List<NotificationResponseDTO> getNotifications(String userId) {
        log.info("Fetching notifications from Linqra Gateway for user: {}", userId);
        try {
            String url = baseUrl + "/api/notifications/all/{userId}";
            ResponseEntity<List<NotificationResponseDTO>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<NotificationResponseDTO>>() {
                    },
                    userId);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
            return Collections.emptyList();
        } catch (Exception e) {
            log.error("Failed to fetch notifications from Linqra Gateway: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Get unread notification count for a specific user from the Linqra Gateway
     */
    public long getUnreadNotificationCount(String userId) {
        log.info("Fetching unread count from Linqra Gateway for user: {}", userId);
        try {
            String url = baseUrl + "/api/notifications/count/unread/{userId}";
            ResponseEntity<Long> response = restTemplate.getForEntity(url, Long.class, userId);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
            return 0;
        } catch (Exception e) {
            log.error("Failed to fetch unread count from Linqra Gateway: {}", e.getMessage());
            return 0;
        }
    }

    /**
     * Mark a notification as read in the Linqra Gateway
     */
    public boolean markNotificationAsRead(String notificationId) {
        log.info("Marking notification {} as read in Linqra Gateway", notificationId);
        try {
            ResponseEntity<Void> response = restTemplate.postForEntity(
                    baseUrl + "/api/notifications/" + notificationId + "/read",
                    null,
                    Void.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.error("Failed to mark notification as read in Linqra Gateway: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Subscribe a user to a resource via the Linqra Gateway
     */
    public Map<String, Object> subscribe(Map<String, Object> subscriptionRequest) {
        log.info("Creating subscription in Linqra Gateway: {}", subscriptionRequest);
        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    baseUrl + "/api/subscriptions/subscribe/user",
                    subscriptionRequest,
                    Map.class);
            return (Map<String, Object>) response.getBody();
        } catch (Exception e) {
            log.error("Failed to create subscription in Linqra Gateway: {}", e.getMessage());
            throw new RuntimeException("Gateway subscription failed: " + e.getMessage());
        }
    }

    /**
     * Unsubscribe a user via the Linqra Gateway
     */
    public boolean unsubscribe(String subscriptionId) {
        log.info("Deleting subscription {} in Linqra Gateway", subscriptionId);
        try {
            restTemplate.delete(baseUrl + "/api/subscriptions/" + subscriptionId);
            return true;
        } catch (Exception e) {
            log.error("Failed to delete subscription in Linqra Gateway: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Fetch all teams assigned to a specific user from the Linqra Gateway
     */
    public List<TeamDTO> getTeamsByUserId(String userId) {
        log.info("Fetching teams from Linqra Gateway for user: {}", userId);
        try {
            String url = baseUrl + "/api/teams/user/{userId}";
            ResponseEntity<List<TeamDTO>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<TeamDTO>>() {
                    },
                    userId);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
            return Collections.emptyList();
        } catch (Exception e) {
            log.error("Failed to fetch teams from Linqra Gateway for user {}: {}", userId, e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Fetch all available teams from Linqra Gateway
     */
    public List<TeamDTO> fetchTeams() {
        log.info("Fetching teams from Linqra Gateway at {}...", baseUrl);
        try {
            ResponseEntity<List<TeamDTO>> response = restTemplate.exchange(
                    baseUrl + "/api/teams",
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<TeamDTO>>() {
                    });
            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (Exception e) {
            log.error("Failed to fetch teams from Linqra: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Download a document from Linqra Gateway and return its bytes.
     *
     * @param documentId  the document ID
     * @param bearerToken the raw JWT from the browser (Linqra-compatible),
     *                    forwarded as
     *                    {@code X-User-Token} so the gateway can resolve the
     *                    correct team context
     *                    and decryption key.
     */
    public ResponseEntity<byte[]> downloadDocument(String documentId, String bearerToken) {
        String url = baseUrl + "/api/documents/view/" + documentId + "/download";
        try {
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("X-User-Token", bearerToken);
            headers.setBearerAuth(bearerToken);
            headers.setAccept(java.util.List.of(org.springframework.http.MediaType.APPLICATION_OCTET_STREAM,
                    org.springframework.http.MediaType.ALL));

            org.springframework.http.HttpEntity<Void> entity = new org.springframework.http.HttpEntity<>(null, headers);

            return restTemplate.exchange(
                    url, HttpMethod.GET, entity, byte[].class);
        } catch (Exception e) {
            log.error("Exception downloading document {}: {}", documentId, e.getMessage());
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get the status and result of a Linq Agent Task execution
     */
    public WorkflowExecutionDTO getAgentExecution(String executionId) {
        log.info("Fetching Linq Agent Task Execution '{}' via Gateway...", executionId);
        try {
            ResponseEntity<WorkflowExecutionDTO> response = restTemplate.getForEntity(
                    baseUrl + "/linq/workflows/executions/" + executionId,
                    WorkflowExecutionDTO.class);
            return response.getBody();
        } catch (Exception e) {
            log.error("Failed to fetch agent execution status: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Fetch agent task executions from Linqra Gateway with a limit and optional
     * agentTaskId
     */
    public PaginatedExecutionsDTO fetchAllExecutions(String agentTaskId, String institution, int limit) {
        log.info("Fetching latest {} agent workflow executions from Linqra Gateway (TaskId: {}, Inst: {})...",
                limit, agentTaskId, institution);
        try {
            String url = baseUrl + "/linq/workflows/executions?limit=" + limit;
            if (agentTaskId != null && !agentTaskId.trim().isEmpty()) {
                url += "&agentTaskId=" + agentTaskId;
            }
            if (institution != null && !institution.trim().isEmpty()) {
                url += "&institution=" + institution;
            }
            ResponseEntity<PaginatedExecutionsDTO> response = restTemplate.getForEntity(url,
                    PaginatedExecutionsDTO.class);
            return response.getBody();
        } catch (Exception e) {
            log.error("Failed to fetch agent workflow executions: {}", e.getMessage());
            return PaginatedExecutionsDTO.builder()
                    .executions(Collections.emptyList())
                    .total(0)
                    .limit(limit)
                    .build();
        }
    }

    /**
     * Cancel an ongoing agent task execution
     */
    public boolean cancelAgentExecution(String executionId) {
        log.info("Requesting cancellation for agent execution '{}' via Gateway...", executionId);
        try {
            ResponseEntity<Object> response = restTemplate.postForEntity(
                    baseUrl + "/api/agent-tasks/executions/" + executionId + "/cancel",
                    new HttpEntity<>(Collections.emptyMap()),
                    Object.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.error("Failed to cancel agent execution '{}': {}", executionId, e.getMessage());
            return false;
        }
    }

    /**
     * Fetch all agent tasks for a specific agent ID from the Linqra Gateway
     */
    public List<AgentTaskDTO> getAgentTasks(String agentId, String bearerToken) {
        log.info("Fetching agent tasks from Linqra Gateway for agent ID: {}", agentId);
        try {
            String url = baseUrl + "/api/agents/" + agentId + "/tasks";

            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("X-User-Token", bearerToken);
            headers.setBearerAuth(bearerToken);
            headers.setAccept(java.util.List.of(org.springframework.http.MediaType.APPLICATION_JSON));

            org.springframework.http.HttpEntity<Void> entity = new org.springframework.http.HttpEntity<>(headers);

            ResponseEntity<List<AgentTaskDTO>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    new ParameterizedTypeReference<List<AgentTaskDTO>>() {
                    });

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
            return Collections.emptyList();
        } catch (Exception e) {
            log.error("Failed to fetch agent tasks from Linqra Gateway for agent ID {}: {}", agentId, e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Fetch multiple agents including their tasks by ID in one batch
     */
    public List<AgentDTO> getAgentsList(List<String> agentIds, String bearerToken) {
        log.info("Batch fetching agents from Linqra Gateway for IDs: {}", agentIds);
        try {
            String url = baseUrl + "/api/agents/list";

            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("X-User-Token", bearerToken);
            headers.setBearerAuth(bearerToken);
            headers.setAccept(java.util.List.of(org.springframework.http.MediaType.APPLICATION_JSON));
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);

            org.springframework.http.HttpEntity<List<String>> entity = new org.springframework.http.HttpEntity<>(
                    agentIds, headers);

            ResponseEntity<List<AgentDTO>> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    new ParameterizedTypeReference<List<AgentDTO>>() {
                    });

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
            return Collections.emptyList();
        } catch (Exception e) {
            log.error("Failed to batch fetch agents from Linqra Gateway: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
}
