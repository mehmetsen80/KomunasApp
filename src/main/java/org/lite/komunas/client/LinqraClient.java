package org.lite.komunas.client;

import lombok.extern.slf4j.Slf4j;
import org.lite.komunas.dto.EmailRequestDTO;
import org.lite.komunas.dto.NotificationResponseDTO;
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

    /**
     * Fetch all notifications for a specific user from the Linqra Gateway
     */
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
}
