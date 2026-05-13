package org.lite.komunas.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import com.microsoft.playwright.Browser;
import com.microsoft.playwright.BrowserContext;
import com.microsoft.playwright.BrowserType;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Playwright;
import com.microsoft.playwright.options.LoadState;
import org.lite.komunas.dto.ResourceCheckResult;
import org.lite.komunas.dto.ResourceCommitRequest;
import org.lite.komunas.dto.ResourceCommitResponse;
import org.lite.komunas.dto.ResourceUpdateNotification;
import org.lite.komunas.entity.ResourceSyncState;
import org.lite.komunas.entity.ResourceVersionHistory;
import org.lite.komunas.enums.ResourceChangeType;
import org.lite.komunas.enums.USCISTrackableForm;
import org.lite.komunas.repository.ResourceSyncStateRepository;
import org.lite.komunas.repository.ResourceVersionHistoryRepository;
import org.lite.komunas.service.USCISProcessingTimesScraperService;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.nio.file.Paths;
import java.util.*;

@Service("uscisProcessingTimesScraper")
@Slf4j
@RequiredArgsConstructor
public class USCISProcessingTimesScraperServiceImpl implements USCISProcessingTimesScraperService {

    private final ResourceSyncStateRepository syncStateRepository;
    private final ResourceVersionHistoryRepository historyRepository;

    private static final String USCIS_PROCESSING_TIMES_API = "https://egov.uscis.gov/processing-times";

    @Override
    public ResourceCheckResult checkForUpdates(String domain, String formId, String formCategory, String officeCode) {
        String resourceId = formId + (formCategory != null && !formCategory.isEmpty() ? "-" + formCategory : "") + "-" + officeCode;
        log.info("Processing Times Specialist checking for updates - Domain: {}, Form: {}, Category: {}, Office: {}", domain, formId, formCategory, officeCode);

        Map<String, Object> timesData = scrapeProcessingTimes(formId, formCategory, officeCode);
        return processScrapeResult(domain, resourceId, formId, timesData);
    }

    private ResourceCheckResult processScrapeResult(String domain, String resourceId, String formId, Map<String, Object> timesData) {
        String currentHash = generateStateHash(timesData);
        String category = "processing-times";
        ResourceCheckResult result = null;

        Optional<ResourceSyncState> stateOpt = syncStateRepository.findByDomainAndCategoryAndResourceId(domain, category, resourceId);
        String version = LocalDateTime.now().getYear() + "-" + LocalDateTime.now().getMonthValue();

        if (stateOpt.isPresent()) {
            ResourceSyncState existingState = stateOpt.get();
            boolean hashChanged = !currentHash.equals(existingState.getLastKnownHash());
            String resultSummary = hashChanged ? "Processing Times Update for " + formId : "No changes to Processing Times for " + formId;

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
                    .resourceUrl(USCIS_PROCESSING_TIMES_API)
                    .shouldSync(hashChanged || !existingState.isEnabled())
                    .payload(timesData)
                    .build();
        } else {
            result = ResourceCheckResult.builder()
                    .resourceId(resourceId)
                    .domain(domain)
                    .category(category)
                    .changed(true)
                    .oldVersion("INITIAL")
                    .newVersion(version)
                    .summary("Initial Processing Times discovery for " + formId)
                    .oldHash("INITIAL")
                    .newHash(currentHash)
                    .resourceUrl(USCIS_PROCESSING_TIMES_API)
                    .shouldSync(true)
                    .payload(timesData)
                    .build();
        }

        return result;
    }

    @Override
    public ResourceCommitResponse commitUpdate(ResourceCommitRequest request) {
        log.info("Processing Times Specialist committing update for {}/{} ({}): hash={}",
                request.getDomain(), request.getCategory(), request.getResourceId(), request.getHash());

        ResourceSyncState state = syncStateRepository
                .findByDomainAndCategoryAndResourceId(request.getDomain(), request.getCategory(),
                        request.getResourceId())
                .map(existingState -> {
                    existingState.setLastKnownHash(request.getHash());
                    existingState.setLastKnownVersion(request.getVersion());
                    existingState.setAgentTaskId(request.getAgentTaskId());
                    existingState.setChangeType(ResourceChangeType.PROCESSING_TIMES_UPDATE.getValue());
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
                        .changeType(ResourceChangeType.PROCESSING_TIMES_UPDATE.getValue())
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
                .changeType(ResourceChangeType.PROCESSING_TIMES_UPDATE.getValue())
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

    private Map<String, Object> scrapeProcessingTimes(String formId, String formCategory, String officeCode) {
        log.info("Scraping Processing Times via Playwright UI Automation: {}", USCIS_PROCESSING_TIMES_API);
        Map<String, Object> data = new HashMap<>();
        data.put("formId", formId);
        if (formCategory != null) data.put("formCategory", formCategory);
        data.put("officeCode", officeCode);

        try (Playwright playwright = Playwright.create()) {
            BrowserContext context = playwright.firefox().launchPersistentContext(
                    Paths.get(System.getProperty("user.home"), ".komunas_firefox_profile"),
                    new BrowserType.LaunchPersistentContextOptions()
                            .setHeadless(false)
                            .setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:125.0) Gecko/20100101 Firefox/125.0")
            );
            Page page = context.pages().isEmpty() ? context.newPage() : context.pages().get(0);

            log.info("Playwright navigating to {}", USCIS_PROCESSING_TIMES_API);
            page.navigate(USCIS_PROCESSING_TIMES_API);
            
            // Wait for Cloudflare Turnstile/challenge to clear
            page.waitForLoadState(LoadState.NETWORKIDLE);
            
            // Try to auto-click the Turnstile widget if it appears
            try {
                if (page.locator("iframe[title*='Cloudflare']").count() > 0) {
                    log.info("Cloudflare Turnstile detected. Attempting auto-click bypass...");
                    page.frameLocator("iframe[title*='Cloudflare']").locator("body").click(new com.microsoft.playwright.Locator.ClickOptions().setDelay(200));
                    Thread.sleep(4000);
                }
            } catch (Exception ignore) {}

            // Playwright UI Automation:
            // Act like a human: fill out the dropdowns and click submit.
            // Using the exact values: I-130, 134A-IR, FOD
            page.locator("#formName").selectOption(formId);
            
            if (formCategory != null && !formCategory.isEmpty()) {
                page.locator("#formCategory").selectOption(formCategory);
            }
            
            String actualOfficeVal = officeCode;
            if ("SCOPS".equals(actualOfficeVal)) {
                actualOfficeVal = "SCD";
                log.info("Mapped SCOPS to dropdown value: {}", actualOfficeVal);
            }
            
            page.locator("select[id*='office']").selectOption(actualOfficeVal);
            page.locator("button:has-text('Get processing time')").click();

            // Wait for the result to render on the screen!
            // Next.js streams the response via RSC, so we wait for the text to appear instead of tracking the network.
            page.locator("text=completed within").waitFor();

            // Extract the result directly from the DOM
            String resultText = page.locator("body").innerText();
            extractAndCleanPayload(resultText, data);
        } catch (Exception e) {
            log.error("Failed to extract Processing Times (Playwright headless failure): {}", e.getMessage());
            data.put("error", e.getMessage());
        }

        return data;
    }

    private String generateStateHash(Map<String, Object> data) {
        try {
            if (data.containsKey("error")) return "ERROR_" + System.currentTimeMillis();
            
            String rawJson = (String) data.getOrDefault("rawJson", "");
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawJson.getBytes());
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            return "ERROR_HASHING";
        }
    }

    private void extractAndCleanPayload(String resultText, Map<String, Object> data) {
        String estimatedTime = "Unknown";
        String timeUnit = "Unknown";
        String token = "80% of cases are completed within";
        int idx = resultText.indexOf(token);
        if (idx != -1) {
            String sub = resultText.substring(idx + token.length()).trim();
            String[] lines = sub.split("\\r?\\n");
            if (lines.length >= 1) {
                estimatedTime = lines[0].trim();
                if (estimatedTime.toLowerCase().contains("see notes")) {
                    timeUnit = "N/A";
                } else if (lines.length >= 2) {
                    timeUnit = lines[1].trim();
                }
            }
        }
        
        String notesText = "";
        int notesIdx = resultText.indexOf("Notes");
        if (notesIdx != -1) {
            int endNotesIdx = resultText.indexOf("What does this processing time mean?");
            if (endNotesIdx > notesIdx) {
                notesText = resultText.substring(notesIdx + 5, endNotesIdx).replaceAll("\\r?\\n", " ").trim();
            }
        }
        
        data.put("estimatedTime", estimatedTime);
        data.put("timeUnit", timeUnit);
        data.put("notes", notesText);
        
        // This clean string ensures the hash only tracks true data updates, not UI changes
        data.put("rawJson", String.format("Time: %s %s | Notes: %s", estimatedTime, timeUnit, notesText));
    }

    @Override
    public List<ResourceCheckResult> checkAllUpdates(String domain) {
        return performBatchScrape(domain, Arrays.asList(USCISTrackableForm.values()));
    }

    @Override
    public ResourceCheckResult checkAllUpdatesForForm(String domain, String formId) {
        List<USCISTrackableForm> targets = Arrays.stream(USCISTrackableForm.values())
                .filter(form -> form.getFormId().equalsIgnoreCase(formId))
                .toList();
        
        if (targets.isEmpty()) {
            log.warn("No tracked combinations found for form: {}", formId);
            return null;
        }
        
        // Scrape all sub-combinations
        List<ResourceCheckResult> batchResults = performBatchScrape(domain, targets);
        
        // Aggregate payload
        Map<String, Object> aggregatedPayload = new HashMap<>();
        for (ResourceCheckResult res : batchResults) {
            aggregatedPayload.put(res.getResourceId(), res.getPayload());
        }
        
        // Generate a composite master hash for the entire form
        String compositeHash = generateStateHash(aggregatedPayload);
        String category = "processing-times";
        
        Optional<ResourceSyncState> stateOpt = syncStateRepository.findByDomainAndCategoryAndResourceId(domain, category, formId);
        String version = LocalDateTime.now().getYear() + "-" + LocalDateTime.now().getMonthValue();
        
        if (stateOpt.isPresent()) {
            ResourceSyncState existingState = stateOpt.get();
            boolean hashChanged = !compositeHash.equals(existingState.getLastKnownHash());
            
            return ResourceCheckResult.builder()
                    .resourceId(formId)
                    .domain(domain)
                    .category(category)
                    .changed(hashChanged)
                    .oldVersion(existingState.getLastKnownVersion())
                    .newVersion(version)
                    .summary(hashChanged ? "Processing Times Update for " + formId : "No changes to Processing Times for " + formId)
                    .oldHash(existingState.getLastKnownHash())
                    .newHash(compositeHash)
                    .resourceUrl(USCIS_PROCESSING_TIMES_API)
                    .shouldSync(hashChanged || !existingState.isEnabled())
                    .payload(aggregatedPayload)
                    .build();
        } else {
            return ResourceCheckResult.builder()
                    .resourceId(formId)
                    .domain(domain)
                    .category(category)
                    .changed(true)
                    .oldVersion("INITIAL")
                    .newVersion(version)
                    .summary("Initial Processing Times discovery for " + formId)
                    .oldHash("INITIAL")
                    .newHash(compositeHash)
                    .resourceUrl(USCIS_PROCESSING_TIMES_API)
                    .shouldSync(true)
                    .payload(aggregatedPayload)
                    .build();
        }
    }

    private List<ResourceCheckResult> performBatchScrape(String domain, List<USCISTrackableForm> targets) {
        List<ResourceCheckResult> results = new ArrayList<>();
        log.info("Starting Batch Processing Times Scrape for {} combinations...", targets.size());

        // Share ONE single browser context for the entire batch to avoid Cloudflare detection
        try (Playwright playwright = Playwright.create()) {
            BrowserContext context = playwright.firefox().launchPersistentContext(
                    Paths.get(System.getProperty("user.home"), ".komunas_firefox_profile"),
                    new BrowserType.LaunchPersistentContextOptions()
                            .setHeadless(false)
                            .setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:125.0) Gecko/20100101 Firefox/125.0")
            );
            Page page = context.pages().isEmpty() ? context.newPage() : context.pages().get(0);

            log.info("Playwright navigating to {}", USCIS_PROCESSING_TIMES_API);
            page.navigate(USCIS_PROCESSING_TIMES_API);
            page.waitForLoadState(LoadState.NETWORKIDLE);
            
            // Try to auto-click the Turnstile widget if it appears
            try {
                if (page.locator("iframe[title*='Cloudflare']").count() > 0) {
                    log.info("Cloudflare Turnstile detected. Attempting auto-click bypass...");
                    page.frameLocator("iframe[title*='Cloudflare']").locator("body").click(new com.microsoft.playwright.Locator.ClickOptions().setDelay(200));
                    Thread.sleep(4000);
                }
            } catch (Exception ignore) {}

            for (USCISTrackableForm target : targets) {
                log.info("Scraping combo: {} | {} | {}", target.getFormId(), target.getCategoryCode(), target.getOfficeCode());
                Map<String, Object> data = new HashMap<>();
                data.put("formId", target.getFormId());
                if (target.getCategoryCode() != null) data.put("formCategory", target.getCategoryCode());
                data.put("officeCode", target.getOfficeCode());

                try {
                    page.locator("#formName").selectOption(target.getFormId());
                    if (target.getCategoryCode() != null && !target.getCategoryCode().isEmpty()) {
                        page.locator("#formCategory").selectOption(target.getCategoryCode());
                    }
                    String actualOfficeVal = target.getOfficeCode();
                    if ("SCOPS".equals(actualOfficeVal)) {
                        actualOfficeVal = "SCD";
                        log.info("Mapped SCOPS to dropdown value: {}", actualOfficeVal);
                    }
                    
                    page.locator("select[id*='office']").selectOption(actualOfficeVal);
                    page.locator("button:has-text('Get processing time')").click();

                    page.locator("text=completed within").waitFor(new com.microsoft.playwright.Locator.WaitForOptions().setTimeout(15000));
                    String resultText = page.locator("body").innerText();
                    extractAndCleanPayload(resultText, data);

                    // Add a randomized human delay (3 to 6 seconds) between each check
                    Thread.sleep(3000 + new Random().nextInt(3000));
                } catch (Exception e) {
                    log.error("Failed to scrape target {}: {}", target.name(), e.getMessage());
                    data.put("error", e.getMessage());
                }

                // Evaluate the DB state using our helper
                String resourceId = target.getFormId() + (target.getCategoryCode() != null && !target.getCategoryCode().isEmpty() ? "-" + target.getCategoryCode() : "") + "-" + target.getOfficeCode();
                results.add(processScrapeResult(domain, resourceId, target.getFormId(), data));
            }
        } catch (Exception e) {
            log.error("Batch scraping failed catastrophically: {}", e.getMessage());
        }

        return results;
    }

    @Override
    public void handleResourceUpdate(ResourceUpdateNotification notification) {
        log.info("Processing Times Specialist processing update signal: {}", notification.getResourceId());
    }
}
