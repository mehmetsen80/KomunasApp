package org.lite.komunas.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lite.komunas.entity.ResourceSyncState;
import org.lite.komunas.entity.ResourceVersionHistory;
import org.lite.komunas.repository.ResourceSyncStateRepository;
import org.lite.komunas.repository.ResourceVersionHistoryRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResourceSyncStateScheduler {

        private final RestTemplate restTemplate;
        private final ResourceSyncStateRepository syncStateRepository;
        private final ResourceVersionHistoryRepository historyRepository;

        @Value("${gateway.base-url}")
        private String gatewayBaseUrl;

        /**
         * Daily reconciliation of orphaned ResourceSyncState records.
         * Checks for sync states whose documentId no longer exists in KnowledgeHub.
         * Uses defensive guards and soft-deletes (enabled = false).
         */
        @Scheduled(cron = "0 0 */6 * * ?") // Run every 6 hours to check for orphaned records
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
                        String instrDocId = syncState.getInstructionsDocumentId();

                        if (!StringUtils.hasText(docId) && !StringUtils.hasText(instrDocId))
                                continue;

                        try {
                                // 2. Strict Verification: Check if either document is gone from the Hub
                                boolean primaryGone = StringUtils.hasText(docId) && isDocumentGone(docId);
                                boolean instructionsGone = StringUtils.hasText(instrDocId)
                                                && isDocumentGone(instrDocId);

                                if (primaryGone || instructionsGone) {
                                        log.warn("🚨 Hub confirmed document(s) GONE - Primary: {}, Instructions: {}. Soft-deactivating.",
                                                        primaryGone ? docId : "OK",
                                                        instructionsGone ? instrDocId : "OK");

                                        // Update state by nulling IDs that are gone
                                        if (primaryGone)
                                                syncState.setDocumentId(null);
                                        if (instructionsGone)
                                                syncState.setInstructionsDocumentId(null);

                                        // 3. Deactivate associated version history records
                                        List<ResourceVersionHistory> histories = historyRepository
                                                        .findBySyncStateId(syncState.getId());
                                        histories.forEach(h -> h.setEnabled(false));
                                        historyRepository.saveAll(histories);

                                        syncState.setEnabled(false);
                                        syncStateRepository.save(syncState);
                                        deactivatedCount++;
                                }
                        } catch (Exception e) {
                                // Transient error (network, timeout, 5xx) -> Skip the record to be safe
                                log.error("❌ Transient error reconciling document {}: {}. Skipping deactivation.",
                                                docId, e.getMessage());
                        }
                }

                log.info("✅ Defensive Reconciliation completed. Deactivated {} orphaned records.", deactivatedCount);
        }

        private boolean isDocumentGone(String docId) {
                try {
                        String url = gatewayBaseUrl + "/api/kh/sync/documents/" + docId + "/exists";
                        ResponseEntity<Boolean> response = restTemplate.getForEntity(url, Boolean.class);
                        return response.getStatusCode() == HttpStatus.OK && Boolean.FALSE.equals(response.getBody());
                } catch (Exception e) {
                        log.error("❌ Error checking existence for document {}: {}", docId, e.getMessage());
                        return false; // Assume it exists if we can't check
                }
        }

        private boolean isHubHealthy() {
                try {
                        String url = gatewayBaseUrl + "/health";
                        ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
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
