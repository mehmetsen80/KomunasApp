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
import org.lite.komunas.repository.ResourceSyncStateRepository;
import org.lite.komunas.repository.ResourceVersionHistoryRepository;
import org.lite.komunas.enums.ResourceChangeType;
import org.lite.komunas.service.USCISVisaBulletinScraperService;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.*;

@Service("uscisVisaBulletinScraper")
@Slf4j
@RequiredArgsConstructor
public class USCISVisaBulletinScraperServiceImpl implements USCISVisaBulletinScraperService {

    private final ResourceSyncStateRepository syncStateRepository;
    private final ResourceVersionHistoryRepository historyRepository;

    private static final String USCIS_VISA_BULLETIN_URL = "https://www.uscis.gov/green-card/green-card-processes-and-procedures/visa-availability-priority-dates/adjustment-of-status-filing-charts-from-the-visa-bulletin";

    @Override
    public ResourceCheckResult checkForUpdates(String domain, String resourceId) {
        log.info("Visa Specialist checking for updates - Domain: {}, ID: {}", domain, resourceId);

        Map<String, Object> bulletinData = scrapeBulletin();

        String currentHash = generateStateHash(bulletinData);
        String category = "visa-bulletin";
        ResourceCheckResult result = null;

        Optional<ResourceSyncState> stateOpt = syncStateRepository.findByDomainAndCategoryAndResourceId(domain,
                category, resourceId);

        String currentMonth = (String) bulletinData.get("month");
        String currentYear = (String) bulletinData.get("year");
        String version = currentMonth + " " + currentYear;

        if (stateOpt.isPresent()) {
            ResourceSyncState existingState = stateOpt.get();
            boolean hashChanged = !currentHash.equals(existingState.getLastKnownHash());

            String resultSummary = hashChanged ? "Visa Bulletin Update: " + version
                    : "No changes to Visa Bulletin charts.";

            // Aggregate tables into a generic injectedHtml field for the gateway
            StringBuilder tables = new StringBuilder();
            if (bulletinData.containsKey("familyFinalActionTable"))
                tables.append(bulletinData.get("familyFinalActionTable"));
            if (bulletinData.containsKey("familyDatesForFilingTable"))
                tables.append(bulletinData.get("familyDatesForFilingTable"));
            if (bulletinData.containsKey("employmentFinalActionTable"))
                tables.append(bulletinData.get("employmentFinalActionTable"));
            if (bulletinData.containsKey("employmentDatesForFilingTable"))
                tables.append(bulletinData.get("employmentDatesForFilingTable"));
            bulletinData.put("injectedHtml", tables.toString());

            result = ResourceCheckResult.builder()
                    .resourceId(resourceId)
                    .domain(domain)
                    .category(category)
                    .changed(hashChanged)
                    .oldVersion(existingState.getLastKnownVersion())
                    .newVersion(version)
                    .summary(resultSummary)
                    .oldHash(existingState.getLastKnownHash())
                    .newHash(currentHash)
                    .resourceUrl(USCIS_VISA_BULLETIN_URL)
                    .shouldSync(hashChanged || !existingState.isEnabled())
                    .payload(bulletinData)
                    .build();
        } else {
            // Aggregate tables into a generic injectedHtml field for the gateway
            StringBuilder tables = new StringBuilder();
            if (bulletinData.containsKey("familyFinalActionTable"))
                tables.append(bulletinData.get("familyFinalActionTable"));
            if (bulletinData.containsKey("familyDatesForFilingTable"))
                tables.append(bulletinData.get("familyDatesForFilingTable"));
            if (bulletinData.containsKey("employmentFinalActionTable"))
                tables.append(bulletinData.get("employmentFinalActionTable"));
            if (bulletinData.containsKey("employmentDatesForFilingTable"))
                tables.append(bulletinData.get("employmentDatesForFilingTable"));
            bulletinData.put("injectedHtml", tables.toString());

            result = ResourceCheckResult.builder()
                    .resourceId(resourceId)
                    .domain(domain)
                    .category(category)
                    .changed(true)
                    .oldVersion("INITIAL")
                    .newVersion(version)
                    .summary("Initial Visa Bulletin discovery: " + version)
                    .oldHash("INITIAL")
                    .newHash(currentHash)
                    .resourceUrl(USCIS_VISA_BULLETIN_URL)
                    .shouldSync(true)
                    .payload(bulletinData)
                    .build();
        }

        return result;
    }

    @Override
    public ResourceCommitResponse commitUpdate(ResourceCommitRequest request) {
        log.info("Visa Specialist committing update for {}/{} ({}): hash={}",
                request.getDomain(), request.getCategory(), request.getResourceId(), request.getHash());

        ResourceSyncState state = syncStateRepository
                .findByDomainAndCategoryAndResourceId(request.getDomain(), request.getCategory(),
                        request.getResourceId())
                .map(existingState -> {
                    existingState.setLastKnownHash(request.getHash());
                    existingState.setLastKnownVersion(request.getVersion());
                    existingState.setAgentTaskId(request.getAgentTaskId());
                    existingState.setChangeType(ResourceChangeType.VISA_BULLETIN_UPDATE.getValue());
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
                        .changeType(ResourceChangeType.VISA_BULLETIN_UPDATE.getValue())
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
                .changeType(ResourceChangeType.VISA_BULLETIN_UPDATE.getValue())
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
                .build();
    }

    private Map<String, Object> scrapeBulletin() {
        log.info("Sovereign extraction: Scraping Visa Bulletin charts from {}", USCIS_VISA_BULLETIN_URL);
        Map<String, Object> data = new HashMap<>();

        try {
            Document doc = Jsoup.connect(USCIS_VISA_BULLETIN_URL).get();

            // Current Month Determination
            Element currentHeading = doc.selectFirst("h2:contains(Current Month), h2:contains(Current Month’s)");
            if (currentHeading != null) {
                Elements siblings = currentHeading.parent().children();
                int headingIndex = siblings.indexOf(currentHeading);

                for (int i = headingIndex + 1; i < siblings.size(); i++) {
                    Element el = siblings.get(i);
                    if (el.tagName().equals("h2"))
                        break; // Stop at next section

                    String text = el.text();
                    if (text.contains("Family-Sponsored")) {
                        Map<String, String> determination = parseDetermination(el);
                        data.put("familyDetermination", determination);
                        extractMonthYear(text, data);

                        // If we have a DOS URL, scrape it
                        if (determination.containsKey("url")) {
                            scrapeDosContent(determination.get("url"), data);
                        }
                    } else if (text.contains("Employment-Based")) {
                        data.put("employmentDetermination", parseDetermination(el));
                        extractMonthYear(text, data);
                    }
                }
            }

            // Next Month Determination
            Element nextHeading = doc.selectFirst("h2:contains(Next Month), h2:contains(Next Month’s)");
            if (nextHeading != null) {
                Elements siblings = nextHeading.parent().children();
                int headingIndex = siblings.indexOf(nextHeading);

                for (int i = headingIndex + 1; i < siblings.size(); i++) {
                    Element el = siblings.get(i);
                    if (el.tagName().equals("h2"))
                        break;

                    String text = el.text();
                    if (text.contains("Coming soon")) {
                        data.put("nextMonthStatus", "COMING_SOON");
                    } else if (text.contains("Family-Sponsored") || text.contains("Employment-Based")) {
                        data.put("nextMonthStatus", "AVAILABLE");
                    }
                }
            }

        } catch (Exception e) {
            log.error("Failed to extract Visa Bulletin charts: {}", e.getMessage());
        }

        return data;
    }

    private void scrapeDosContent(String url, Map<String, Object> data) {
        log.info("Sovereign extraction: Deep-scraping DOS Visa Bulletin from {}", url);
        try {
            Document doc = Jsoup.connect(url)
                    .userAgent(
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                    .timeout(15000)
                    .get();

            // High-Fidelity Content-Verified Extraction: Identify charts by their unique
            // row keys and closest headers
            Elements tables = doc.select("table");
            for (Element table : tables) {
                String tableText = table.text().replace("\u00A0", " ").replaceAll("\\s+", " ");

                // Content verification: Family charts MUST contain F1, F2A, and F3
                boolean isFamilyChart = tableText.contains("F1") && tableText.contains("F2A")
                        && tableText.contains("F3");
                // Content verification: Employment charts MUST contain 1st, 2nd, and 3rd
                boolean isEmploymentChart = tableText.contains("1st") && tableText.contains("2nd")
                        && tableText.contains("3rd");

                if (!isFamilyChart && !isEmploymentChart)
                    continue;

                // Local Header discovery: Find the specific chart type by looking at the
                // closest preceding header
                String chartType = getClosestHeader(table);
                if (chartType == null)
                    continue;

                if (isFamilyChart) {
                    if ("FINAL".equals(chartType))
                        data.put("familyFinalActionTable", table.outerHtml());
                    else if ("FILING".equals(chartType))
                        data.put("familyDatesForFilingTable", table.outerHtml());
                } else {
                    if ("FINAL".equals(chartType))
                        data.put("employmentFinalActionTable", table.outerHtml());
                    else if ("FILING".equals(chartType))
                        data.put("employmentDatesForFilingTable", table.outerHtml());
                }
            }

            data.put("rawDosText", doc.text());

        } catch (Exception e) {
            log.error("Failed to deep-scrape DOS content: {}", e.getMessage());
        }
    }

    private String getClosestHeader(Element table) {
        // Scans upwards and backwards from the table to find the VERY FIRST mention of
        // a chart type
        Element current = table;
        int safetyLimit = 20; // Scan up to 20 elements preceding the table

        while (current != null && safetyLimit > 0) {
            Element prev = current.previousElementSibling();
            while (prev != null && safetyLimit > 0) {
                String text = prev.text().toUpperCase();
                if (text.contains("FINAL ACTION DATES"))
                    return "FINAL";
                if (text.contains("DATES FOR FILING"))
                    return "FILING";

                // If we hit another chart table or major section header, stop to avoid
                // cross-contamination
                if (prev.tagName().equals("table") && (prev.text().contains("F1") || prev.text().contains("1st")))
                    return null;
                if (text.contains("PREFERENCES"))
                    return null;

                prev = prev.previousElementSibling();
                safetyLimit--;
            }
            current = current.parent();
        }
        return null;
    }

    private Map<String, String> parseDetermination(Element el) {
        Map<String, String> result = new HashMap<>();
        String text = el.text();

        if (text.contains("Dates for Filing")) {
            result.put("chartType", "Dates for Filing");
        } else if (text.contains("Final Action Dates")) {
            result.put("chartType", "Final Action Dates");
        } else {
            result.put("chartType", "Unknown");
        }

        Element link = el.selectFirst("a");
        if (link != null) {
            result.put("url", link.attr("href"));
        }

        return result;
    }

    private void extractMonthYear(String text, Map<String, Object> data) {
        // Simple regex or string parsing to find month/year like "May 2026"
        String[] months = { "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December" };

        for (String m : months) {
            if (text.contains(m)) {
                data.put("month", m);
                // Extract year (4 digits)
                java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("\\d{4}").matcher(text);
                if (matcher.find()) {
                    data.put("year", matcher.group());
                }
                break;
            }
        }
    }

    private String generateStateHash(Map<String, Object> data) {
        try {
            StringBuilder sb = new StringBuilder();
            sb.append(data.get("month")).append("|").append(data.get("year")).append("|");

            Map<String, String> family = (Map<String, String>) data.get("familyDetermination");
            if (family != null)
                sb.append(family.get("chartType")).append("|");

            Map<String, String> employment = (Map<String, String>) data.get("employmentDetermination");
            if (employment != null)
                sb.append(employment.get("chartType")).append("|");

            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(sb.toString().getBytes());
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            return "ERROR_HASHING";
        }
    }

    @Override
    public List<ResourceCheckResult> checkAllUpdates(String domain) {
        return List.of(checkForUpdates(domain, "filing-charts"));
    }

    @Override
    public void handleResourceUpdate(ResourceUpdateNotification notification) {
        log.info("Visa Specialist processing update signal: {}", notification.getResourceId());
    }
}
