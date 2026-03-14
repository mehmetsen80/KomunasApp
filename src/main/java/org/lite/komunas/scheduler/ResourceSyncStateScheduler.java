package org.lite.komunas.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lite.komunas.entity.ResourceSyncState;
import org.lite.komunas.repository.ResourceSyncStateRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResourceSyncStateScheduler {

        private final RestTemplate restTemplate;
        private final ResourceSyncStateRepository syncStateRepository;

        /**
         * Daily reconciliation of orphaned ResourceSyncState records.
         * Checks for sync states whose documentId no longer exists in KnowledgeHub.
         * Uses defensive guards and soft-deletes (enabled = false).
         */
        @Scheduled(cron = "0 0 3 * * ?") // Run at 3 AM every day
        public void reconcileOrphanedSyncStates() {
                log.info("Starting Defensive Reconciliation of ResourceSyncState records...");

                // 1. Pre-flight Health Check: Verify Hub (api-gateway) is reachable and healthy
                if (!isHubHealthy()) {
                        log.error("🛑 Hub (api-gateway) is NOT healthy or unreachable. Aborting reconciliation to prevent accidental data deactivation.");
                        return;
                }

                List<ResourceSyncState> activeStates = syncStateRepository.findByEnabledTrue();
                int deactivatedCount = 0;

                for (ResourceSyncState syncState : activeStates) {
                        String docId = syncState.getDocumentId();
                        if (docId == null)
                                continue;

                        try {
                                // 2. Strict Verification: Only deactivate if the Hub explicitly returns 200 OK
                                // with exists=false
                                String url = "http://api-gateway/api/v1/kh/sync/documents/" + docId + "/exists";
                                ResponseEntity<Boolean> response = restTemplate.getForEntity(url, Boolean.class);

                                if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                                        if (Boolean.FALSE.equals(response.getBody())) {
                                                log.warn("🚨 Hub confirmed document {} is GONE. Soft-deactivating local sync state (Category: {}, ID: {})",
                                                                docId, syncState.getResourceCategory(),
                                                                syncState.getResourceId());

                                                // Soft delete instead of hard delete
                                                syncState.setEnabled(false);
                                                syncStateRepository.save(syncState);
                                                deactivatedCount++;
                                        }
                                } else {
                                        log.warn("⚠️ Unexpected response from Hub for document {}: {}. Skipping.",
                                                        docId, response.getStatusCode());
                                }
                        } catch (Exception e) {
                                // Transient error (network, timeout, 5xx) -> Skip the record to be safe
                                log.error("❌ Transient error reconciling document {}: {}. Skipping deactivation.",
                                                docId, e.getMessage());
                        }
                }

                log.info("✅ Defensive Reconciliation completed. Deactivated {} orphaned records.", deactivatedCount);
        }

        private boolean isHubHealthy() {
                try {
                        ResponseEntity<Map> response = restTemplate.getForEntity("http://api-gateway/health",
                                        Map.class);
                        Map<?, ?> body = response.getBody();
                        if (response.getStatusCode() == HttpStatus.OK && body != null) {
                                String status = (String) body.get("status");
                                return "UP".equalsIgnoreCase(status);
                        }
                } catch (Exception e) {
                        log.warn("Health check failed for Hub: {}", e.getMessage());
                }
                return false;
        }
}
