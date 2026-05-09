package org.lite.komunas.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lite.komunas.dto.USCISStatusResponse;
import org.lite.komunas.entity.ResourceSyncState;
import org.lite.komunas.entity.ResourceVersionHistory;
import org.lite.komunas.repository.ResourceSyncStateRepository;
import org.lite.komunas.repository.ResourceVersionHistoryRepository;
import org.lite.komunas.client.LinqraClient;
import org.lite.komunas.service.USCISStatusService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
@RequiredArgsConstructor
public class USCISStatusServiceImpl implements USCISStatusService {

    private static final String USCIS_DOMAIN = "uscis-sentinel";
    private static final String USCIS_CATEGORY_FORMS = "forms";
    private static final String USCIS_CATEGORY_ANNOUNCEMENTS = "announcements";
    private static final String USCIS_CATEGORY_POLICY = "policy-manual";

    private final ResourceSyncStateRepository syncStateRepository;
    private final ResourceVersionHistoryRepository versionHistoryRepository;
    private final LinqraClient linqraClient;
    private final ObjectMapper objectMapper;

    @Override
    public Optional<USCISStatusResponse> getFormStatus(String formId) {
        return getFormStatus(formId, null);
    }

    @Override
    public Optional<USCISStatusResponse> getFormStatus(String formId, String userId) {
        log.info("Fetching USCIS status for form: {} for user: {}", formId, userId);

        Optional<ResourceSyncState> stateOpt = syncStateRepository.findByDomainAndCategoryAndResourceId(USCIS_DOMAIN,
                USCIS_CATEGORY_FORMS, formId);

        if (stateOpt.isEmpty())
            return Optional.empty();

        ResourceSyncState state = stateOpt.get();
        USCISStatusResponse response = mapToResponse(state);

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
    public List<USCISStatusResponse> getAllFormStatuses() {
        return getAllFormStatuses(null);
    }

    @Override
    public List<USCISStatusResponse> getAllFormStatuses(String userId) {
        log.info("Fetching USCIS form statuses for user: {}", userId);

        List<ResourceSyncState> states = syncStateRepository.findByDomainAndCategory(USCIS_DOMAIN,
                USCIS_CATEGORY_FORMS);

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
                    USCISStatusResponse response = mapToResponse(state);
                    if (subscriptionsMap.containsKey(state.getResourceId())) {
                        Map<String, Object> sub = subscriptionsMap.get(state.getResourceId());
                        response.setSubscribed(true);
                        response.setSubscriptionId((String) sub.get("id"));
                    }
                    return response;
                })
                .toList();
    }

    @Override
    public Optional<USCISStatusResponse> getNewsroomStatus(String resourceId) {
        return getNewsroomStatus(resourceId, null);
    }

    @Override
    public Optional<USCISStatusResponse> getNewsroomStatus(String resourceId, String userId) {
        log.info("Fetching USCIS newsroom status for: {} for user: {}", resourceId, userId);

        Optional<ResourceSyncState> stateOpt = syncStateRepository.findByDomainAndCategoryAndResourceId(USCIS_DOMAIN,
                USCIS_CATEGORY_ANNOUNCEMENTS, resourceId);

        if (stateOpt.isEmpty()) {
            log.info("No newsroom state found for: {}. Returning initial status.", resourceId);
            // Return a "Discovery" status so the UI can allow the user to start monitoring
            return Optional.of(USCISStatusResponse.builder()
                    .resourceId(resourceId)
                    .domain(USCIS_DOMAIN)
                    .category(USCIS_CATEGORY_ANNOUNCEMENTS)
                    .currentVersion("INITIAL")
                    .enabled(true)
                    .subscribed(false)
                    .build());
        }

        ResourceSyncState state = stateOpt.get();
        USCISStatusResponse response = mapToResponse(state);

        // Check subscription if userId is present
        if (userId != null) {
            List<Map<String, Object>> subscriptions = linqraClient.getSubscriptions(userId);
            for (Map<String, Object> sub : subscriptions) {
                if (resourceId.equals(sub.get("resourceId")) && USCIS_DOMAIN.equals(sub.get("domain"))
                        && USCIS_CATEGORY_ANNOUNCEMENTS.equals(sub.get("category"))) {
                    response.setSubscribed(true);
                    response.setSubscriptionId((String) sub.get("id"));
                    break;
                }
            }
        }

        return Optional.of(response);
    }

    @Override
    public Optional<USCISStatusResponse> getPolicyManualStatus(String resourceId) {
        return getPolicyManualStatus(resourceId, null);
    }

    @Override
    public Optional<USCISStatusResponse> getPolicyManualStatus(String resourceId, String userId) {
        log.info("Fetching USCIS policy status for: {} for user: {}", resourceId, userId);

        Optional<ResourceSyncState> stateOpt = syncStateRepository.findByDomainAndCategoryAndResourceId(USCIS_DOMAIN,
                USCIS_CATEGORY_POLICY, resourceId);

        if (stateOpt.isEmpty()) {
            log.info("No policy state found for: {}. Returning initial status.", resourceId);
            return Optional.of(USCISStatusResponse.builder()
                    .resourceId(resourceId)
                    .domain(USCIS_DOMAIN)
                    .category(USCIS_CATEGORY_POLICY)
                    .currentVersion("INITIAL")
                    .enabled(true)
                    .subscribed(false)
                    .build());
        }

        ResourceSyncState state = stateOpt.get();
        USCISStatusResponse response = mapToResponse(state);

        // Check subscription if userId is present
        if (userId != null) {
            List<Map<String, Object>> subscriptions = linqraClient.getSubscriptions(userId);
            for (Map<String, Object> sub : subscriptions) {
                if (resourceId.equals(sub.get("resourceId")) && USCIS_DOMAIN.equals(sub.get("domain"))
                        && USCIS_CATEGORY_POLICY.equals(sub.get("category"))) {
                    response.setSubscribed(true);
                    response.setSubscriptionId((String) sub.get("id"));
                    break;
                }
            }
        }

        return Optional.of(response);
    }

    private USCISStatusResponse mapToResponse(ResourceSyncState state) {
        List<ResourceVersionHistory> history = versionHistoryRepository
                .findByDomainAndCategoryAndResourceIdOrderByDetectedAtDesc(
                        state.getDomain(), state.getCategory(), state.getResourceId());

        List<USCISStatusResponse.VersionEntry> versionEntries = history.stream()
                .map(h -> {
                    USCISStatusResponse.VersionEntry entry = USCISStatusResponse.from(h);
                    entry.setSummary(beautifySummary(entry.getSummary()));
                    return entry;
                })
                .toList();

        return USCISStatusResponse.builder()
                .resourceId(state.getResourceId())
                .domain(state.getDomain())
                .category(state.getCategory())
                .currentVersion(state.getLastKnownVersion())
                .effectiveDate(state.getEffectiveDate())
                .resourceUrl(state.getResourceUrl())
                .instructionsUrl(state.getInstructionsUrl())
                .supplementalResources(state.getSupplementalResources())
                .changeDetected(state.isChangeDetected())
                .changeType(state.getChangeType())
                .summary(beautifySummary(state.getSummary()))
                .lastCheckedAt(state.getLastCheckedAt())
                .lastUpdatedAt(state.getLastUpdatedAt())
                .enabled(state.isEnabled())
                .payload(extractPayloadSafe(state))
                .versionHistory(versionEntries)
                .build();
    }

    private String beautifySummary(String summary) {
        if (summary == null)
            return null;
        return summary.replace("newsroom-alerts", "USCIS Announcements")
                .replace("news-releases", "USCIS News Releases")
                .replace("policy-updates", "USCIS Policy Manual Updates");
    }

    private Map<String, Object> extractPayloadSafe(ResourceSyncState state) {
        // Priority 1: Use the dedicated payload field if it exists (Vendor Neutral)
        if (state.getPayload() != null && !state.getPayload().isEmpty()) {
            return state.getPayload();
        }

        // Priority 2: Safe fallback for existing records with buried LLM analysis
        if (state.getLastAnalysis() == null)
            return null;

        try {
            // Recursively search for any JSON content in the analysis map (OpenAI, Gemini,
            // Claude compatible)
            String jsonContent = findJsonContent(state.getLastAnalysis());
            if (jsonContent != null) {
                return objectMapper.readValue(jsonContent, Map.class);
            }
        } catch (Exception e) {
            log.debug("No structured payload found in analysis for resource: {}", state.getResourceId());
        }
        return null;
    }

    /**
     * Recursively searches for a string that looks like a JSON object within a Map
     * or List.
     */
    private String findJsonContent(Object obj) {
        if (obj instanceof String) {
            String str = ((String) obj).trim();

            // Priority 1: Cleanly stripped markdown
            if (str.contains("```")) {
                int start = str.indexOf("{");
                int end = str.lastIndexOf("}");
                if (start != -1 && end != -1 && start < end) {
                    str = str.substring(start, end + 1).trim();
                }
            }

            // Priority 2: Direct JSON check
            if (str.startsWith("{") && str.endsWith("}")) {
                return str;
            }

            // Priority 3: Regex fallback for buried JSON
            Pattern pattern = Pattern.compile("\\{.*\\}", Pattern.DOTALL);
            Matcher matcher = pattern.matcher(str);
            if (matcher.find()) {
                return matcher.group();
            }
        } else if (obj instanceof Map) {
            for (Object value : ((Map<?, ?>) obj).values()) {
                String found = findJsonContent(value);
                if (found != null)
                    return found;
            }
        } else if (obj instanceof List) {
            for (Object item : (List<?>) obj) {
                String found = findJsonContent(item);
                if (found != null)
                    return found;
            }
        }
        return null;
    }
}
