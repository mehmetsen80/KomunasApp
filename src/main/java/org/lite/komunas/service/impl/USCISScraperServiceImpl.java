package org.lite.komunas.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.lite.komunas.dto.ResourceCheckResult;
import org.lite.komunas.dto.ResourceCommitRequest;
import org.lite.komunas.dto.ResourceCommitResponse;
import org.lite.komunas.dto.SentinelMetadata;
import org.lite.komunas.entity.ResourceSyncState;
import org.lite.komunas.entity.ResourceVersionHistory;
import org.lite.komunas.repository.ResourceSyncStateRepository;
import org.lite.komunas.repository.ResourceVersionHistoryRepository;
import org.lite.komunas.service.USCISScraperService;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * UNIFIED SCRAPER SERVICE - Domain sovereign logic.
 * This class owns the scraping, hashing, and sync state for USCIS resources.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class USCISScraperServiceImpl implements USCISScraperService {

    private final ResourceSyncStateRepository syncStateRepository;
    private final ResourceVersionHistoryRepository historyRepository;
    private final RestClient restClient = RestClient.create();

    private static final String USCIS_BASE_URL = "https://www.uscis.gov/";
    private static final String PDF_URL_PREFIX = "https://www.uscis.gov";
    private static final Pattern VERSION_PATTERN = Pattern.compile("(\\d{2}/\\d{2}/\\d{2})");

    @Override
    public ResourceCheckResult checkForUpdates(String category, String resourceId) {
        log.info("Worker checking for updates - Category: {}, ID: {}", category, resourceId);

        SentinelMetadata metadata = scrapeUSCIS(resourceId);
        return processMetadata(category, resourceId, metadata);
    }

    private ResourceCheckResult processMetadata(String category, String resourceId, SentinelMetadata metadata) {
        String currentHash = downloadAndHash(metadata.getResourceUrl());

        return syncStateRepository.findByResourceCategoryAndResourceId(category, resourceId)
                .map(existingState -> {
                    boolean versionChanged = !metadata.getVersion().equals(existingState.getLastKnownVersion());
                    boolean hashChanged = !currentHash.equals(existingState.getLastKnownHash());
                    boolean changed = versionChanged || hashChanged;

                    return ResourceCheckResult.builder()
                            .resourceId(resourceId)
                            .changed(changed)
                            .oldVersion(existingState.getLastKnownVersion())
                            .newVersion(metadata.getVersion())
                            .oldHash(existingState.getLastKnownHash())
                            .currentHash(currentHash)
                            .resourceUrl(metadata.getResourceUrl())
                            .oldDocumentId(existingState.getDocumentId())
                            .shouldSync(changed)
                            .build();
                })
                .orElseGet(() -> ResourceCheckResult.builder()
                        .resourceId(resourceId)
                        .changed(true)
                        .oldVersion("INITIAL")
                        .newVersion(metadata.getVersion())
                        .oldHash("INITIAL")
                        .currentHash(currentHash)
                        .resourceUrl(metadata.getResourceUrl())
                        .oldDocumentId(null)
                        .shouldSync(true)
                        .build());
    }

    @Override
    public ResourceCommitResponse commitUpdate(ResourceCommitRequest request) {
        log.info("Worker committing update for {} ({}): version={}, hash={}",
                request.getResourceCategory(), request.getResourceId(), request.getVersion(), request.getHash());

        ResourceSyncState state = syncStateRepository
                .findByResourceCategoryAndResourceId(request.getResourceCategory(), request.getResourceId())
                .map(existingState -> {
                    existingState.setLastKnownVersion(request.getVersion());
                    existingState.setLastKnownHash(request.getHash());
                    existingState.setDocumentId(request.getDocumentId());
                    existingState.setOldDocumentId(request.getOldDocumentId());
                    existingState.setAgentTaskId(request.getAgentTaskId());
                    existingState.setChangeType(request.getChangeType());
                    existingState.setChangeDetected(request.isChangeDetected());
                    existingState.setSummary(request.getSummary());
                    existingState.setResourceUrl(request.getResourceUrl());
                    existingState.setLastAnalysis(request.getAnalysis());
                    existingState.setLastCheckedAt(LocalDateTime.now());
                    existingState.setLastUpdatedAt(LocalDateTime.now());
                    existingState.setEnabled(true); // Re-enable if it was soft-deleted
                    return existingState;
                })
                .orElseGet(() -> ResourceSyncState.builder()
                        .resourceCategory(request.getResourceCategory())
                        .resourceId(request.getResourceId())
                        .documentId(request.getDocumentId())
                        .oldDocumentId(request.getOldDocumentId())
                        .agentTaskId(request.getAgentTaskId())
                        .changeType(request.getChangeType())
                        .changeDetected(request.isChangeDetected())
                        .summary(request.getSummary())
                        .resourceUrl(request.getResourceUrl())
                        .lastKnownVersion(request.getVersion())
                        .lastKnownHash(request.getHash())
                        .lastAnalysis(request.getAnalysis())
                        .lastCheckedAt(LocalDateTime.now())
                        .lastUpdatedAt(LocalDateTime.now())
                        .enabled(true)
                        .build());

        syncStateRepository.save(state);

        ResourceVersionHistory history = ResourceVersionHistory.builder()
                .resourceCategory(request.getResourceCategory())
                .resourceId(request.getResourceId())
                .version(request.getVersion())
                .hash(request.getHash())
                .resourceUrl(request.getResourceUrl())
                .documentId(request.getDocumentId())
                .oldDocumentId(request.getOldDocumentId())
                .agentTaskId(request.getAgentTaskId())
                .changeType(request.getChangeType())
                .changeDetected(request.isChangeDetected())
                .summary(request.getSummary())
                .analysis(request.getAnalysis())
                .detectedAt(LocalDateTime.now())
                .build();
        historyRepository.save(history);

        return ResourceCommitResponse.builder()
                .resourceId(state.getResourceId())
                .resourceCategory(state.getResourceCategory())
                .version(state.getLastKnownVersion())
                .summary(state.getSummary())
                .status("COMMITTED")
                .build();
    }

    @Override
    public void handleDocumentDeletion(String documentId) {
        log.info("Soft-deactivating ResourceSyncState for document: {}", documentId);
        syncStateRepository.findByDocumentId(documentId)
                .ifPresent(state -> {
                    log.info("Found sync state for document {}. Setting enabled=false.", documentId);
                    state.setEnabled(false);
                    syncStateRepository.save(state);
                });
    }

    private String downloadAndHash(String url) {
        if (url == null || url.isBlank())
            return "NO_URL";

        try {
            byte[] bytes = restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(byte[].class);

            if (bytes == null)
                return "EMPTY_CONTENT";

            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(bytes);
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            log.error("Failed to download or hash resource from {}: {}", url, e.getMessage());
            return "ERROR_DOWNLOADING";
        }
    }

    private SentinelMetadata scrapeUSCIS(String formId) {
        // Ensure formId has a dash if it's alphanumeric and for common forms (e.g. i130
        // -> i-130)
        String normalizedFormId = formId.toLowerCase().trim();
        if (normalizedFormId.matches("[a-z]\\d+")) {
            normalizedFormId = normalizedFormId.charAt(0) + "-" + normalizedFormId.substring(1);
        }

        String url = USCIS_BASE_URL + normalizedFormId;
        log.info("Scraping USCIS for form {}: {}", normalizedFormId, url);

        try {
            Document doc = Jsoup.connect(url).get();

            // Extract version (Edition Date)
            // The structure is usually an accordion. Let's look for "Edition Date" heading.
            String version = "UNKNOWN";
            Element editionHeader = doc.selectFirst("h4:contains(Edition Date)");
            if (editionHeader != null) {
                Element panel = editionHeader.nextElementSibling();
                if (panel != null) {
                    Matcher matcher = VERSION_PATTERN.matcher(panel.text());
                    if (matcher.find()) {
                        version = matcher.group(1);
                    }
                }
            }

            // Fallback to searching the whole page for the pattern if not found in the
            // specific section
            if ("UNKNOWN".equals(version)) {
                Matcher matcher = VERSION_PATTERN.matcher(doc.text());
                if (matcher.find()) {
                    version = matcher.group(1);
                }
            }

            // Extract PDF Link
            Element pdfLink = doc.select("a[href$='.pdf']").first();
            if (pdfLink == null) {
                throw new RuntimeException("Could not find PDF link for form " + normalizedFormId);
            }

            String pdfPath = pdfLink.attr("href");
            String pdfUrl = pdfPath.startsWith("http") ? pdfPath : PDF_URL_PREFIX + pdfPath;

            return SentinelMetadata.builder()
                    .version(version)
                    .resourceUrl(pdfUrl)
                    .build();
        } catch (Exception e) {
            log.error("Failed to scrape USCIS form {}: {}", normalizedFormId, e.getMessage());
            throw new RuntimeException("Scraping failed for form " + normalizedFormId + ": " + e.getMessage(), e);
        }
    }
}
