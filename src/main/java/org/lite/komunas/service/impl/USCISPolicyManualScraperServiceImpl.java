package org.lite.komunas.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.lite.komunas.dto.ResourceCheckResult;
import org.lite.komunas.dto.ResourceCommitRequest;
import org.lite.komunas.dto.ResourceCommitResponse;
import org.lite.komunas.dto.ResourceUpdateNotification;
import org.lite.komunas.entity.ResourceSyncState;
import org.lite.komunas.entity.ResourceVersionHistory;
import org.lite.komunas.enums.ResourceChangeType;
import org.lite.komunas.repository.ResourceSyncStateRepository;
import org.lite.komunas.repository.ResourceVersionHistoryRepository;
import org.lite.komunas.service.USCISPolicyManualScraperService;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.*;

/**
 * POLICY MANUAL SCRAPER SERVICE
 * Specialized in monitoring the USCIS Policy Manual for substantive legal
 * changes.
 */
@Service("uscisPolicyManualScraper")
@Slf4j
@RequiredArgsConstructor
public class USCISPolicyManualScraperServiceImpl implements USCISPolicyManualScraperService {

    private final ResourceSyncStateRepository syncStateRepository;
    private final ResourceVersionHistoryRepository historyRepository;

    private static final String USCIS_POLICY_UPDATES_URL = "https://www.uscis.gov/policy-manual/updates";

    @Override
    public ResourceCheckResult checkForUpdates(String domain, String resourceId) {
        log.info("Policy Specialist checking for updates - Domain: {}, ID: {}", domain, resourceId);

        List<Map<String, Object>> updates = scrapeUpdates();

        // Generate state hash from the structured update list
        String currentHash = generateStateHash(updates);
        String category = "policy-manual";
        ResourceCheckResult result = null;

        Optional<ResourceSyncState> stateOpt = syncStateRepository.findByDomainAndCategoryAndResourceId(domain,
                category, resourceId);

        if (stateOpt.isPresent()) {
            ResourceSyncState existingState = stateOpt.get();
            boolean hashChanged = !currentHash.equals(existingState.getLastKnownHash());

            String newVersion = updates.isEmpty() ? "EMPTY" : (String) updates.get(0).get("date");

            Map<String, Object> payloadMap = new HashMap<>();
            payloadMap.put("updates", updates);

            String latestTitle = updates.isEmpty() ? "No updates" : (String) updates.get(0).get("title");
            String resultSummary = hashChanged ? "New policy guidance: " + latestTitle
                    : "No new policy updates detected.";

            result = ResourceCheckResult.builder()
                    .resourceId(resourceId)
                    .domain(domain)
                    .category(category)
                    .changed(hashChanged)
                    .oldVersion(existingState.getLastKnownVersion())
                    .newVersion(newVersion)
                    .summary(resultSummary)
                    .oldHash(existingState.getLastKnownHash())
                    .newHash(currentHash)
                    .resourceUrl(USCIS_POLICY_UPDATES_URL)
                    .shouldSync(hashChanged || !existingState.isEnabled())
                    .payload(payloadMap)
                    .build();
        } else {
            Map<String, Object> payloadMap = new HashMap<>();
            payloadMap.put("updates", updates);

            String latestTitle = updates.isEmpty() ? "No updates" : (String) updates.get(0).get("title");
            String resultSummary = "Initial policy guidance discovery: " + latestTitle;

            result = ResourceCheckResult.builder()
                    .resourceId(resourceId)
                    .domain(domain)
                    .category(category)
                    .changed(true)
                    .oldVersion("INITIAL")
                    .newVersion(updates.isEmpty() ? "INITIAL" : (String) updates.get(0).get("date"))
                    .summary(resultSummary)
                    .oldHash("INITIAL")
                    .newHash(currentHash)
                    .resourceUrl(USCIS_POLICY_UPDATES_URL)
                    .shouldSync(true)
                    .payload(payloadMap)
                    .build();
        }

        return result;
    }

    @Override
    public ResourceCommitResponse commitUpdate(ResourceCommitRequest request) {
        log.info("Policy Specialist committing update for {}/{} ({}): hash={}",
                request.getDomain(), request.getCategory(), request.getResourceId(), request.getHash());

        ResourceSyncState state = syncStateRepository
                .findByDomainAndCategoryAndResourceId(request.getDomain(), request.getCategory(),
                        request.getResourceId())
                .map(existingState -> {
                    existingState.setLastKnownHash(request.getHash());
                    existingState.setLastKnownVersion(request.getVersion());
                    existingState.setAgentTaskId(request.getAgentTaskId());
                    existingState.setChangeType(ResourceChangeType.POLICY_UPDATE.getValue());
                    existingState.setChangeDetected(request.isChangeDetected());
                    existingState.setSummary(request.getSummary());
                    existingState.setLastAnalysis(request.getAnalysis());
                    existingState.setPayload(request.getPayload());
                    existingState.setLastCheckedAt(LocalDateTime.now());
                    existingState.setLastUpdatedAt(LocalDateTime.now());
                    existingState.setEnabled(true);
                    return existingState;
                })
                .orElseGet(() -> ResourceSyncState.builder()
                        .domain(request.getDomain())
                        .category(request.getCategory())
                        .resourceId(request.getResourceId())
                        .agentTaskId(request.getAgentTaskId())
                        .changeType(ResourceChangeType.POLICY_UPDATE.getValue())
                        .changeDetected(request.isChangeDetected())
                        .summary(request.getSummary())
                        .resourceUrl(request.getResourceUrl())
                        .lastKnownHash(request.getHash())
                        .lastKnownVersion(request.getVersion())
                        .lastAnalysis(request.getAnalysis())
                        .payload(request.getPayload())
                        .lastCheckedAt(LocalDateTime.now())
                        .lastUpdatedAt(LocalDateTime.now())
                        .enabled(true)
                        .build());

        ResourceSyncState savedState = syncStateRepository.save(state);

        ResourceVersionHistory history = ResourceVersionHistory.builder()
                .domain(request.getDomain())
                .category(request.getCategory())
                .resourceId(request.getResourceId())
                .syncStateId(savedState.getId())
                .agentTaskId(request.getAgentTaskId())
                .version(request.getVersion())
                .hash(request.getHash())
                .changeType(ResourceChangeType.POLICY_UPDATE.getValue())
                .summary(request.getSummary())
                .changeDetected(request.isChangeDetected())
                .analysis(request.getAnalysis())
                .payload(request.getPayload())
                .resourceUrl(request.getResourceUrl())
                .detectedAt(LocalDateTime.now())
                .build();

        historyRepository.save(history);

        return ResourceCommitResponse.builder()
                .resourceId(savedState.getResourceId())
                .domain(savedState.getDomain())
                .category(savedState.getCategory())
                .version(savedState.getLastKnownVersion())
                .summary(savedState.getSummary())
                .status("COMMITTED")
                .changeDetected(savedState.isChangeDetected())
                .build();
    }

    private List<Map<String, Object>> scrapeUpdates() {
        log.info("Sovereign extraction: Scraping Policy Manual Updates from {}", USCIS_POLICY_UPDATES_URL);
        List<Map<String, Object>> updates = new ArrayList<>();

        try {
            Document doc = Jsoup.connect(USCIS_POLICY_UPDATES_URL).get();
            Elements rows = doc.select(".views-row");

            for (Element row : rows) {
                // Each update is wrapped in .pm-updates
                Element updateEl = row.selectFirst(".pm-updates");
                if (updateEl == null)
                    continue;

                Element headerEl = updateEl.selectFirst(".pm-resource__update_header");
                Element summaryEl = updateEl.selectFirst(".pm-resource__content");
                Element dateEl = updateEl.selectFirst("time");
                Element readMoreLink = updateEl.selectFirst("a:contains(Read More), a[href$='.pdf']");
                Elements chapterLinks = updateEl.select(".affected-sections a");

                if (summaryEl != null) {
                    Map<String, Object> update = new HashMap<>();

                    String dateText = dateEl != null ? dateEl.text().trim() : "UNKNOWN";
                    String titleText = headerEl != null ? headerEl.text().trim() : "Policy Update";

                    String readMoreUrl = "";
                    if (readMoreLink != null) {
                        readMoreUrl = readMoreLink.attr("href");
                        if (!readMoreUrl.startsWith("http"))
                            readMoreUrl = "https://www.uscis.gov" + readMoreUrl;
                    }

                    // Generate a unique ID based on title and summary hash
                    update.put("id", titleText + "-" + Math.abs(summaryEl.text().trim().hashCode()));
                    update.put("date", dateText);
                    update.put("title", titleText);
                    update.put("summary", summaryEl.text().trim());
                    update.put("url", readMoreUrl);

                    List<Map<String, String>> affectedChapters = new ArrayList<>();
                    for (Element link : chapterLinks) {
                        Map<String, String> chapter = new HashMap<>();
                        chapter.put("title", link.text().trim());
                        String href = link.attr("href");
                        chapter.put("url", href.startsWith("http") ? href : "https://www.uscis.gov" + href);
                        affectedChapters.add(chapter);
                    }
                    update.put("chapters", affectedChapters);

                    updates.add(update);
                }
            }

            // Sort all updates by Date (descending) then ID (descending)
            updates.sort((a, b) -> {
                int dateComp = parseDate((String) b.get("date")).compareTo(parseDate((String) a.get("date")));
                return dateComp != 0 ? dateComp : ((String) b.get("id")).compareTo((String) a.get("id"));
            });

            if (updates.size() > 15) {
                updates = new ArrayList<>(updates.subList(0, 15));
            }
        } catch (Exception e) {
            log.error("Failed to extract Policy Manual updates: {}", e.getMessage());
        }

        return updates;
    }

    private java.time.LocalDate parseDate(String dateStr) {
        try {
            if (dateStr == null || "UNKNOWN".equals(dateStr))
                return java.time.LocalDate.MIN;
            java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("MMMM d, yyyy",
                    java.util.Locale.ENGLISH);
            return java.time.LocalDate.parse(dateStr, formatter);
        } catch (Exception e) {
            return java.time.LocalDate.MIN;
        }
    }

    private String generateStateHash(List<Map<String, Object>> updates) {
        try {
            // Sort updates by ID to ensure deterministic hashing regardless of HTML order
            List<Map<String, Object>> sortedUpdates = new ArrayList<>(updates);
            sortedUpdates.sort(Comparator.comparing(u -> (String) u.get("id")));

            StringBuilder sb = new StringBuilder();
            for (Map<String, Object> update : sortedUpdates) {
                sb.append(update.get("id")).append("|").append(update.get("date")).append("|");
            }

            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(sb.toString().getBytes());
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            return "ERROR_HASHING";
        }
    }

    @Override
    public List<ResourceCheckResult> checkAllUpdates(String domain) {
        return List.of(checkForUpdates(domain, "policy-updates"));
    }

    @Override
    public void handleResourceUpdate(ResourceUpdateNotification notification) {
        log.info("Policy Specialist processing update signal: {}", notification.getResourceId());
    }
}
