package org.lite.komunas.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lite.komunas.dto.USCISFormStatusResponse;
import org.lite.komunas.entity.ResourceSyncState;
import org.lite.komunas.entity.ResourceVersionHistory;
import org.lite.komunas.repository.ResourceSyncStateRepository;
import org.lite.komunas.repository.ResourceVersionHistoryRepository;
import org.lite.komunas.client.LinqraClient;
import org.lite.komunas.service.USCISStatusService;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class USCISStatusServiceImpl implements USCISStatusService {

    private static final String USCIS_DOMAIN = "uscis-sentinel";
    private static final String USCIS_CATEGORY_FORMS = "forms";

    private final ResourceSyncStateRepository syncStateRepository;
    private final ResourceVersionHistoryRepository versionHistoryRepository;
    private final LinqraClient linqraClient;

    @Override
    public Optional<USCISFormStatusResponse> getFormStatus(String formId) {
        return getFormStatus(formId, null);
    }

    @Override
    public Optional<USCISFormStatusResponse> getFormStatus(String formId, String userId) {
        log.info("Fetching USCIS status for form: {} for user: {}", formId, userId);

        Optional<ResourceSyncState> stateOpt = syncStateRepository.findByDomainAndCategoryAndResourceId(USCIS_DOMAIN,
                USCIS_CATEGORY_FORMS, formId);

        if (stateOpt.isEmpty())
            return Optional.empty();

        ResourceSyncState state = stateOpt.get();
        USCISFormStatusResponse response = mapToResponse(state);

        // Check subscription if userId is present
        if (userId != null) {
            List<Map<String, Object>> subscriptions = linqraClient.getSubscriptions(userId);
            log.info("Linqra Gateway returned {} subscriptions for single form check (userId: {})",
                    subscriptions.size(), userId);
            for (Map<String, Object> sub : subscriptions) {
                if (formId.equals(sub.get("resourceId")) && USCIS_DOMAIN.equals(sub.get("domain"))
                        && USCIS_CATEGORY_FORMS.equals(sub.get("category"))) {
                    log.info("Subscription MATCH found for form: {} with subscriptionId: {}", formId, sub.get("id"));
                    response.setSubscribed(true);
                    response.setSubscriptionId((String) sub.get("id"));
                    break;
                }
            }
        }

        return Optional.of(response);
    }

    @Override
    public List<USCISFormStatusResponse> getAllFormStatuses() {
        return getAllFormStatuses(null);
    }

    @Override
    public List<USCISFormStatusResponse> getAllFormStatuses(String userId) {
        log.info("Fetching USCIS form statuses for user: {}", userId);

        List<ResourceSyncState> states = syncStateRepository.findByDomainAndCategory(USCIS_DOMAIN, USCIS_CATEGORY_FORMS);

        // Fetch subscriptions if userId is present
        Map<String, Map<String, Object>> subscriptionsMap = new HashMap<>();
        if (userId != null) {
            List<Map<String, Object>> subscriptions = linqraClient.getSubscriptions(userId);
            log.info("Linqra Gateway returned {} subscriptions for user: {}", subscriptions.size(), userId);
            for (Map<String, Object> sub : subscriptions) {
                String resId = (String) sub.get("resourceId");
                String domain = (String) sub.get("domain");
                String category = (String) sub.get("category");
                log.info("Subscription found: resourceId={}, domain={}, category={}", resId, domain, category);

                if (USCIS_DOMAIN.equals(domain) && USCIS_CATEGORY_FORMS.equals(category)) {
                    subscriptionsMap.put(resId, sub);
                }
            }
        }

        return states.stream()
                .map(state -> {
                    USCISFormStatusResponse response = mapToResponse(state);
                    if (subscriptionsMap.containsKey(state.getResourceId())) {
                        Map<String, Object> sub = subscriptionsMap.get(state.getResourceId());
                        response.setSubscribed(true);
                        response.setSubscriptionId((String) sub.get("id"));
                    }
                    return response;
                })
                .toList();
    }

    private USCISFormStatusResponse mapToResponse(ResourceSyncState state) {
        // High-fidelity fallback for domain/category to ensure technical robustness
        String domain = state.getDomain() != null ? state.getDomain() : USCIS_DOMAIN;
        String category = state.getCategory() != null ? state.getCategory() : USCIS_CATEGORY_FORMS;

        List<ResourceVersionHistory> history = versionHistoryRepository
                .findByDomainAndCategoryAndResourceIdOrderByDetectedAtDesc(
                        domain, category, state.getResourceId());

        List<USCISFormStatusResponse.VersionEntry> versionEntries = history.stream()
                .map(USCISFormStatusResponse::from)
                .toList();

        return USCISFormStatusResponse.builder()
                .resourceId(state.getResourceId())
                .domain(domain)
                .category(category)
                .currentVersion(state.getLastKnownVersion())
                .effectiveDate(state.getEffectiveDate())
                .resourceUrl(state.getResourceUrl())
                .instructionsUrl(state.getInstructionsUrl())
                .supplementalResources(state.getSupplementalResources())
                .changeDetected(state.isChangeDetected())
                .changeType(state.getChangeType())
                .summary(state.getSummary())
                .lastCheckedAt(state.getLastCheckedAt())
                .lastUpdatedAt(state.getLastUpdatedAt())
                .enabled(state.isEnabled())
                .versionHistory(versionEntries)
                .build();
    }
}
