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
import org.lite.komunas.service.USCISNewsroomScraperService;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.*;

/**
 * NEWSROOM SCRAPER SERVICE - Specialized in USCIS Alerts and News Releases.
 * Utilizes a technically robust SLUG-BASED primary key strategy for alert
 * tracking.
 */
@Service("uscisNewsroomScraper")
@Slf4j
@RequiredArgsConstructor
public class USCISNewsroomScraperServiceImpl implements USCISNewsroomScraperService {

    private final ResourceSyncStateRepository syncStateRepository;
    private final ResourceVersionHistoryRepository historyRepository;

    private static final String USCIS_ALERTS_URL = "https://www.uscis.gov/newsroom/alerts";
    private static final String USCIS_NEWS_URL = "https://www.uscis.gov/newsroom/news-releases";

    @Override
    public ResourceCheckResult checkForUpdates(String domain, String resourceId) {
        log.info("Newsroom Specialist checking for updates - Domain: {}, ID: {}", domain, resourceId);

        String url = resourceId.equals("newsroom-alerts") ? USCIS_ALERTS_URL : USCIS_NEWS_URL;
        List<Map<String, String>> alerts = scrapeAlerts(url);

        // Generate state hash from the structured alert list
        String currentHash = generateStateHash(alerts);
        String category = "announcements";
        ResourceCheckResult result = null;

        Optional<ResourceSyncState> stateOpt = syncStateRepository.findByDomainAndCategoryAndResourceId(domain,
                category, resourceId);

        if (stateOpt.isPresent()) {
            ResourceSyncState existingState = stateOpt.get();
            boolean hashChanged = !currentHash.equals(existingState.getLastKnownHash());

            // We treat the latest alert's slug + date as the "version" for tracking
            String newVersion = alerts.isEmpty() ? "EMPTY" : alerts.getFirst().get("date");

            Map<String, Object> payloadMap = new HashMap<>();
            payloadMap.put("alerts", alerts);

            String latestTitle = alerts.isEmpty() ? "No alerts" : alerts.getFirst().get("title");
            String resultSummary = hashChanged ? "New news release: " + latestTitle : "No new alerts detected.";

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
                    .resourceUrl(url)
                    .shouldSync(hashChanged || !existingState.isEnabled())
                    .payload(payloadMap)
                    .build();
        } else {
            Map<String, Object> payloadMap = new HashMap<>();
            payloadMap.put("alerts", alerts);

            String latestTitle = alerts.isEmpty() ? "No alerts" : (String) alerts.getFirst().get("title");
            String resultSummary = "Initial news release discovery: " + latestTitle;

            result = ResourceCheckResult.builder()
                    .resourceId(resourceId)
                    .domain(domain)
                    .category(category)
                    .changed(true)
                    .oldVersion("INITIAL")
                    .newVersion(alerts.isEmpty() ? "INITIAL" : alerts.getFirst().get("date"))
                    .summary(resultSummary)
                    .oldHash("INITIAL")
                    .newHash(currentHash)
                    .resourceUrl(url)
                    .shouldSync(true)
                    .payload(payloadMap)
                    .build();
        }

        return result;
    }

    @Override
    public ResourceCommitResponse commitUpdate(ResourceCommitRequest request) {
        log.info("Newsroom Specialist committing update for {}/{} ({}): hash={}",
                request.getDomain(), request.getCategory(), request.getResourceId(), request.getHash());

        ResourceSyncState state = syncStateRepository
                .findByDomainAndCategoryAndResourceId(request.getDomain(), request.getCategory(),
                        request.getResourceId())
                .map(existingState -> {
                    existingState.setLastKnownHash(request.getHash());
                    existingState.setLastKnownVersion(request.getVersion());

                    existingState.setAgentTaskId(request.getAgentTaskId());
                    existingState.setChangeType(ResourceChangeType.ANNOUNCEMENT_UPDATE.getValue());
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
                        .changeType(ResourceChangeType.ANNOUNCEMENT_UPDATE.getValue())
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

        // Create Version History for Newsroom delta
        ResourceVersionHistory history = ResourceVersionHistory.builder()
                .domain(request.getDomain())
                .category(request.getCategory())
                .resourceId(request.getResourceId())
                .syncStateId(savedState.getId())
                .agentTaskId(request.getAgentTaskId())
                .version(request.getVersion())
                .hash(request.getHash())
                .changeType(ResourceChangeType.ANNOUNCEMENT_UPDATE.getValue())
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

    private List<Map<String, String>> scrapeAlerts(String url) {
        log.info("Sovereign extraction: Scraping Alerts from {}", url);
        List<Map<String, String>> alerts = new ArrayList<>();

        try {
            Document doc = Jsoup.connect(url).get();
            Elements rows = doc.select(".views-row");

            for (Element row : rows) {
                Element link = row.selectFirst(".views-field-title a");
                Element dateEl = row.selectFirst(".views-field-field-display-date .datetime");
                Element summaryEl = row.selectFirst(".views-field-body");

                if (link != null) {
                    Map<String, String> alert = new HashMap<>();
                    String href = link.attr("href");

                    // Extract Slug as Primary Key
                    String slug = href.contains("/") ? href.substring(href.lastIndexOf("/") + 1) : href;

                    alert.put("id", slug); // Primary Key
                    alert.put("title", link.text().trim());
                    alert.put("url", href.startsWith("http") ? href : "https://www.uscis.gov" + href);
                    alert.put("date", dateEl != null ? dateEl.text().trim() : "UNKNOWN");
                    alert.put("summary", summaryEl != null ? summaryEl.text().trim() : "");

                    alerts.add(alert);
                }
            }

            // Sort all scraped alerts by Date (descending) then ID (descending)
            alerts.sort((a, b) -> {
                int dateComp = parseDate(b.get("date")).compareTo(parseDate(a.get("date")));
                return dateComp != 0 ? dateComp : b.get("id").compareTo(a.get("id"));
            });

            if (alerts.size() > 10) {
                alerts = new ArrayList<>(alerts.subList(0, 10));
            }
        } catch (Exception e) {
            log.error("Failed to extract sovereign alerts from {}: {}", url, e.getMessage());
        }

        return alerts;
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

    private String generateStateHash(List<Map<String, String>> alerts) {
        try {
            // Sort alerts by ID to ensure deterministic hashing regardless of HTML order
            List<Map<String, String>> sortedAlerts = new ArrayList<>(alerts);
            sortedAlerts.sort(Comparator.comparing(a -> a.get("id")));

            StringBuilder sb = new StringBuilder();
            for (Map<String, String> alert : sortedAlerts) {
                sb.append(alert.get("id")).append("|").append(alert.get("date")).append("|");
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
        // Newsroom Specialist handles newsroom-alerts and news-releases
        return List.of(
                checkForUpdates(domain, "newsroom-alerts"),
                checkForUpdates(domain, "news-releases"));
    }

    @Override
    public void handleResourceUpdate(ResourceUpdateNotification notification) {
        log.info("Newsroom processing update signal: {}", notification.getResourceId());
    }

}
